import React, { useRef, useEffect, useState, useCallback } from 'react';
import maplibregl, { Map, MapMouseEvent, MapGeoJSONFeature, Popup, MapSourceDataEvent, SourceSpecification, LayerSpecification } from 'maplibre-gl'; 
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapStyles, defaultMapStyle } from '@/config/mapStyles';
import { overlayLayers } from '@/config/overlayLayers'; 
import { useFireData } from '@/contexts/FireDataContext';
import { fetchAsthmaData } from '@/utils/asthmaData';
import { fetchTemperatureData } from '@/utils/temperatureData';
import Legend from './Legend';
import LoadingIndicator from './LoadingIndicator';

// Define props
interface MapViewProps {
  activeStyleId: string;
  activeLayerIds: string[];
  minIncidentSize: number; 
  onDataRangeLoad: (min: number, max: number) => void;
  selectedTemperatureYear?: number | null; // Optional prop for selected temperature year
}

const applyAsthmaDataToMap = (currentMap: Map, data: Record<string, number>) => {
  // First, check if the source exists before trying to set feature states
  const sourceId = 'california-county-boundaries-source';
  if (!currentMap.getSource(sourceId)) {
    console.warn(`[applyAsthmaDataToMap] Source '${sourceId}' does not exist in the map. Cannot set feature states.`);
    return;
  }
  
  // Iterate through the data and set state directly using the county name as the ID
  for (const countyName in data) {
    if (Object.prototype.hasOwnProperty.call(data, countyName)) {
      const rate = data[countyName];
      try {
        // Use countyName directly as the feature ID
        console.log(`[applyAsthmaDataToMap] Setting state for ${countyName} (ID: ${countyName}) with rate: ${rate}`);
        currentMap.setFeatureState(
          { source: sourceId, id: countyName },
          { asthmaRate: rate }
        );
      } catch (error) {
        console.error(`[applyAsthmaDataToMap] Error setting feature state for ${countyName}:`, error);
      }
    }
  }
  
  console.log(`[applyAsthmaDataToMap] Applied asthma data to ${Object.keys(data).length} counties.`);

  // Optional: Log to confirm state is being set
  console.log('Applied asthma data using COUNTY_NAME as ID.');

  // It might be good practice to remove state for counties not in the data,
  // although in this case, the source data likely covers all counties.
  // You could query features and check if their COUNTY_NAME is NOT in data,
  // then remove state, but let's keep it simple for now.
};

/**
 * Apply temperature anomaly data to the map
 * @param currentMap The MapLibre map instance
 * @param data Record of county names to temperature anomaly values
 */
const applyTemperatureDataToMap = (currentMap: Map, data: Record<string, number>) => {
  // Verify map and data
  if (!currentMap || !data || Object.keys(data).length === 0) return;
  
  // Source and layer IDs
  const sourceId = 'california-county-boundaries-source';
  const layerId = 'california-temperature-anomaly-layer';
  
  // Verify source exists
  if (!currentMap.getSource(sourceId)) return;
  
  // Make layer visible if it exists
  if (currentMap.getLayer(layerId)) {
    currentMap.setLayoutProperty(layerId, 'visibility', 'visible');
  }
  
  // Clear existing feature states for counties that will be updated
  // We can't use removeFeatureState without feature IDs, so we'll set each to null
  // This is more targeted than the previous approach
  try {
    // Get all features from the source that are visible
    const features = currentMap.querySourceFeatures(sourceId);
    const processedIds = new Set<string>();
    
    // For each feature, clear its temperature anomaly state
    features.forEach(feature => {
      if (feature.properties && feature.properties.COUNTY_NAME) {
        const id = feature.properties.COUNTY_NAME;
        if (!processedIds.has(id)) {
          // Set to null instead of removing
          currentMap.setFeatureState(
            { source: sourceId, id: id },
            { temperatureAnomaly: null }
          );
          processedIds.add(id);
        }
      }
    });
    
    console.log(`[Temperature] Cleared states for ${processedIds.size} counties`);
  } catch (e) {
    console.warn('[Temperature] Error clearing feature states:', e);
    // Continue with setting new states
  }
  
  // Track county names we've processed to avoid duplicates
  const processedCounties = new Set<string>();
  
  // Build a mapping of data to feature IDs
  Object.entries(data).forEach(([countyName, anomaly]) => {
    // Skip if we've already processed this county
    if (processedCounties.has(countyName)) return;
    
    try {
      // Set the feature state directly - MapLibre will handle missing features
      currentMap.setFeatureState(
        { source: sourceId, id: countyName },
        { temperatureAnomaly: anomaly }
      );
      
      // Also try with/without 'County' suffix
      const altCountyName = countyName.includes(' County') 
        ? countyName.replace(' County', '') 
        : `${countyName} County`;
      
      currentMap.setFeatureState(
        { source: sourceId, id: altCountyName },
        { temperatureAnomaly: anomaly }
      );
      
      processedCounties.add(countyName);
    } catch {
      // Silent fail for individual counties
    }
  });
  
  // Force the map to update with a simple repaint
  currentMap.triggerRepaint();
};

const MapView: React.FC<MapViewProps> = ({ 
  activeStyleId, 
  activeLayerIds, 
  minIncidentSize, 
  onDataRangeLoad,
  selectedTemperatureYear
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  // California coordinates (centered on the state)
  const [lng] = useState(-119.4179); 
  const [lat] = useState(37.1666);
  const [zoom] = useState(5.5); // Closer zoom level for California
  
  // Track loading states for specific layers
  const [isFirePerimetersLoading, setIsFirePerimetersLoading] = useState(false);
  const [isAsthmaDataLoading, setIsAsthmaDataLoading] = useState(false);
  
  // Get filtered fire data and layer management function from context
  const { filteredData, isLoading: isFireDataLoading, ensureFireLayerOnTop } = useFireData();
  
  // Store the asthma data
  const [asthmaData, setAsthmaData] = useState<Record<string, number> | null>(null);
  
  // Store the temperature data
  const [temperatureData, setTemperatureData] = useState<Record<string, number> | null>(null);
  
  // Store the year corresponding to currently loaded temperature data
  const [temperatureDataYear, setTemperatureDataYear] = useState<number | null>(null);
  
  // Define updateLayers function with useCallback to avoid dependency issues
  const updateLayers = useCallback((currentMap: Map, currentActiveLayerIds: string[]) => {
    overlayLayers.forEach(layerConfig => {
      const layerId = layerConfig.layer.id;
      const sourceId = layerConfig.sourceId; 

      const layerIsActive = currentActiveLayerIds.includes(layerConfig.id);
      const layerExists = currentMap.getLayer(layerId);
      const sourceExists = currentMap.getSource(sourceId);

      if (layerConfig.type === 'placeholder') return;

      if (layerIsActive && !layerExists) {
        if (!sourceExists && layerConfig.sourceDefinition) {
          try {
            console.log(`Adding source: ${sourceId} with definition type: ${typeof layerConfig.sourceDefinition}`);
            let sourceSpecToAdd: SourceSpecification;

            if (typeof layerConfig.sourceDefinition === 'string') {
              if (layerConfig.type === 'geojson' || layerConfig.type === 'vector' || layerConfig.type === 'raster') {
                if (layerConfig.type === 'raster') {
                    sourceSpecToAdd = { type: 'raster', tiles: [layerConfig.sourceDefinition], tileSize: 256 }; 
                } else {
                    sourceSpecToAdd = { type: layerConfig.type, data: layerConfig.sourceDefinition }; 
                }
              } else {
                console.error(`Source definition for ${sourceId} is a string, but type is ${layerConfig.type} which requires an object definition.`);
                return; 
              }
            } else {
              sourceSpecToAdd = layerConfig.sourceDefinition;
            }

            currentMap.addSource(sourceId, sourceSpecToAdd); 

          } catch (error) {
            console.error(`Error adding source ${sourceId}:`, error);
            return; // Don't try to add layer if source failed
          }
        }
        
        if (currentMap.getSource(sourceId)) {
            try {
                console.log(`Adding layer: ${layerId} for source: ${sourceId}`);
                if ('source' in layerConfig.layer) {
                    if (layerConfig.layer.source === sourceId) {
                        currentMap.addLayer(layerConfig.layer as LayerSpecification);
                    } else {
                        console.error(`Layer ${layerId} source property ('${layerConfig.layer.source}') does not match configured sourceId ('${sourceId}'). Cannot add.`);
                    }
                } else {
                    console.warn(`Layer ${layerId} does not have a 'source' property. Cannot add layer that requires a source.`);
                }
            } catch (error) {
              console.error(`Error adding layer ${layerId}:`, error);
            }
        } else {
            console.warn(`Source ${sourceId} not available when attempting to add layer ${layerId}. Waiting for 'sourcedata'...`);
            currentMap.once('sourcedata', (e) => {
                if (e.sourceId === sourceId && e.isSourceLoaded && currentMap.getSource(sourceId)) {
                    console.log(`Source ${sourceId} loaded after delay, adding layer ${layerId}`);
                    if (!currentMap.getLayer(layerId) && 'source' in layerConfig.layer && layerConfig.layer.source === sourceId) {
                         try {
                            currentMap.addLayer(layerConfig.layer as LayerSpecification);
                         } catch (error) {
                            console.error(`Error adding layer ${layerId} after sourcedata event:`, error);
                         }
                    }
                }
            });
        }
      } else if (!layerIsActive && layerExists) {
        try {
          console.log(`Removing layer: ${layerId}`);
          currentMap.removeLayer(layerId);
        } catch (error) {
          console.error(`Error removing layer ${layerId}:`, error);
        }

        if (currentMap.getSource(sourceId)) {
            const sourceUsedByOtherLayers = overlayLayers.some(otherLayer => 
                otherLayer.id !== layerConfig.id && 
                otherLayer.type !== 'placeholder' && 
                currentActiveLayerIds.includes(otherLayer.id) && 
                otherLayer.sourceId === sourceId 
            );

            if (!sourceUsedByOtherLayers) {
                try {
                    console.log(`Removing source: ${sourceId} as it's no longer used.`);
                    currentMap.removeSource(sourceId);
                } catch (error) {
                    console.error(`Error removing source ${sourceId}:`, error);
                }
            } else {
                console.log(`Source ${sourceId} still in use by other layers, not removing.`);
            }
        }
      }
    });
    
    // Ensure fire layers are on top after layer updates
    if (currentMap) {
      ensureFireLayerOnTop(currentMap);
    }
  }, [ensureFireLayerOnTop]);

  // Define loadAsthmaData function before it's used in useEffect
  const loadAsthmaData = useCallback(async () => {
    console.log('Attempting to load asthma data...');
    setIsAsthmaDataLoading(true);
    try {
      const data = await fetchAsthmaData(); // Fetch data using the utility function
      console.log(`Asthma data loaded successfully for ${Object.keys(data).length} counties.`);
      setAsthmaData(data);
    } catch (error) {
      console.error('Error loading asthma data:', error);
      setAsthmaData(null); // Set to null on error
    } finally {
      setIsAsthmaDataLoading(false);
    }
  }, []); // Depends only on fetchAsthmaData import
  
  // Define loadTemperatureData function before it's used in useEffect
  const loadTemperatureData = useCallback(async (year?: number) => {
    console.log(`Attempting to load temperature data${year ? ` for year 20${year}` : ' (average)'}...`);
    try {
      const data = await fetchTemperatureData(year); // Fetch data using the utility function
      console.log(`Temperature data loaded successfully for ${Object.keys(data).length} counties.`);
      setTemperatureData(data);
      setTemperatureDataYear(year ?? null); // Track which year this data belongs to
      return data; // Return the data for immediate use if needed
    } catch (error) {
      console.error('Error loading temperature data:', error);
      setTemperatureData(null); // Set to null on error
      return null;
    }
  }, []); // Depends only on fetchTemperatureData import

  // Single source of truth for temperature data updates
  useEffect(() => {
    // Exit early if map isn't ready or temperature layer isn't active
    if (!map.current) return;
    if (!activeLayerIds.includes('california-temperature-anomaly')) return;
    
    const currentMap = map.current;
    const countySourceId = 'california-county-boundaries-source';
    const temperatureLayerId = 'california-temperature-anomaly-layer';
    
    // Debug log - just simple info about what's being requested
    const yearLabel = selectedTemperatureYear === null ? 'average' : `20${selectedTemperatureYear}`;
    console.log(`[Temperature] Loading data for year: ${yearLabel}`);
    
    // Prevent multiple concurrent loads
    let isCancelled = false;
    
    // Define a self-contained async function for loading and applying data
    const updateTemperatureData = async () => {
      // Start loading indicator
      // Removed unused isTemperatureDataLoading state
      
      try {
        // Ensure source exists
        if (!currentMap.getSource(countySourceId)) {
          console.error('[Temperature] County boundaries source not found');
          return;
        }
        
        // Make sure layer is visible
        if (currentMap.getLayer(temperatureLayerId)) {
          currentMap.setLayoutProperty(temperatureLayerId, 'visibility', 'visible');
        }
        
        // Fetch data for the selected year
        const year = selectedTemperatureYear; // Capture current value to prevent race conditions
        const data = await fetchTemperatureData(year || undefined);
        
        // If this request was superseded by a newer one, exit
        if (isCancelled) return;
        
        // Apply data if valid
        if (data && Object.keys(data).length > 0) {
          console.log(`[Temperature] Applying ${Object.keys(data).length} county data points for ${yearLabel}`);
          applyTemperatureDataToMap(currentMap, data);
        } else {
          console.error('[Temperature] No data returned for year:', yearLabel);
        }
      } catch (error) {
        if (!isCancelled) console.error('[Temperature] Error:', error);
      } finally {
        // Removed unused isTemperatureDataLoading state
      }
    };
    
    // Start the update process
    updateTemperatureData();
    
    // Clean-up function to prevent race conditions
    return () => {
      isCancelled = true;
    };
    
  }, [selectedTemperatureYear, activeLayerIds]); // Only depend on these two props
  
  // Find the initial style object based on the activeStyleId prop
  const initialStyle = mapStyles.find(style => style.id === activeStyleId)?.style || defaultMapStyle.style;

  useEffect(() => {
    if (map.current || !mapContainer.current) return; 

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: initialStyle, 
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [lng, lat, zoom, initialStyle]); 

  useEffect(() => {
    if (!map.current) return; 
    const currentMap = map.current;
    const newStyle = mapStyles.find(style => style.id === activeStyleId)?.style;
    if (!newStyle) return;

    // Store the current active layers before changing style
    const currentActiveLayers = [...activeLayerIds];
    
    // Store current center and zoom to maintain view after style change
    const currentCenter = currentMap.getCenter();
    const currentZoom = currentMap.getZoom();

    try {
      // Set the new style (this will remove all sources and layers)
      currentMap.setStyle(newStyle);

      // After the style is loaded, re-add all vector layers
      currentMap.once('styledata', () => {
        console.log('Base style loaded, re-adding vector layers');
        // Re-add all active overlay layers
        updateLayers(currentMap, currentActiveLayers);
        
        // Restore the view
        currentMap.setCenter(currentCenter);
        currentMap.setZoom(currentZoom);
      });
    } catch (error) {
      console.error("Error setting map style:", error);
    }
  }, [activeStyleId, activeLayerIds, updateLayers]); // Added updateLayers as dependency

  useEffect(() => {
    if (!map.current) return; 
    const currentMap = map.current;

    // Check if fire perimeters layer is being activated
    const wasFirePerimetersActive = activeLayerIds.includes('california-fire-perimeters');
    // Check if asthma layer is being activated
    const wasAsthmaLayerActive = activeLayerIds.includes('california-asthma-prevalence');
    // Check if temperature layer is being activated
    const wasTemperatureLayerActive = activeLayerIds.includes('california-temperature-anomaly');
    
    if (!currentMap.isStyleLoaded()) {
        console.log('Base style not loaded yet, delaying layer update.');
        currentMap.once('styledata', () => {
            console.log('Base style loaded, applying layer updates.');
            updateLayers(currentMap, activeLayerIds);
        });
        return;
    }

    // If fire perimeters is being activated, set loading state
    if (wasFirePerimetersActive && !currentMap.getSource('california-fire-perimeters-source')) {
      setIsFirePerimetersLoading(true);
    }
    
    // If asthma layer is being activated, ensure source exists and load asthma data
    if (wasAsthmaLayerActive) {
      const countySourceId = 'california-county-boundaries-source';
      const asthmaLayerId = 'california-asthma-prevalence-layer';
      
      // First ensure the source exists
      if (!currentMap.getSource(countySourceId)) {
        console.log(`Source '${countySourceId}' missing, will be added by updateLayers`);
        // The source will be added by updateLayers below
      }
      
      // After updateLayers runs, ensure the layer is visible
      setTimeout(() => {
        if (currentMap.getLayer(asthmaLayerId)) {
          currentMap.setLayoutProperty(asthmaLayerId, 'visibility', 'visible');
          console.log('Set asthma layer to visible');
          
          // Load data if not already loaded
          if (!asthmaData) {
            setIsAsthmaDataLoading(true);
            loadAsthmaData();
          } else if (currentMap.getSource(countySourceId)) {
            // Re-apply data if already loaded but needs refreshing
            console.log('Re-applying asthma data to map');
            applyAsthmaDataToMap(currentMap, asthmaData);
          }
        }
      }, 100); // Short delay to ensure updateLayers has completed
    }
    
    // If temperature layer is being activated, ensure source exists and load temperature data
    if (wasTemperatureLayerActive) {
      const countySourceId = 'california-county-boundaries-source';
      const temperatureLayerId = 'california-temperature-anomaly-layer';
      
      // First ensure the source exists
      if (!currentMap.getSource(countySourceId)) {
        console.log(`Source '${countySourceId}' missing, will be added by updateLayers`);
        // The source will be added by updateLayers below
      }
      
      // After updateLayers runs, ensure the layer is visible
      setTimeout(() => {
        if (currentMap.getLayer(temperatureLayerId)) {
          currentMap.setLayoutProperty(temperatureLayerId, 'visibility', 'visible');
          console.log('Set temperature layer to visible');
          
          // Load data if not already loaded or if we need to refresh
          if (!temperatureData || temperatureDataYear !== selectedTemperatureYear) {
            loadTemperatureData(selectedTemperatureYear || undefined)
              .then(data => {
                if (data && currentMap.getSource(countySourceId)) {
                  applyTemperatureDataToMap(currentMap, data);
                }
              });
          } else if (currentMap.getSource(countySourceId)) {
            // Re-apply data if already loaded and corresponds to current year
            console.log('Re-applying temperature data to map');
            applyTemperatureDataToMap(currentMap, temperatureData);
          }
        }
      }, 100); // Short delay to ensure updateLayers has completed
    }

    updateLayers(currentMap, activeLayerIds);

  }, [activeLayerIds, asthmaData, loadAsthmaData, temperatureData, temperatureDataYear, loadTemperatureData, selectedTemperatureYear, ensureFireLayerOnTop, updateLayers]); // Added updateLayers dependency

  useEffect(() => {
    if (!map.current) return; 
    const currentMap = map.current;
    const fireLayerId = 'us-fire-events-wfigs-layer'; 

    const handleLayerClick = (e: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const properties = feature.properties;
        const geometry = feature.geometry;

        if (geometry?.type !== 'Point') {
            console.warn("Clicked feature geometry is not a Point:", geometry);
            return; 
        }

        const coordinates = geometry.coordinates.slice() as [number, number]; 

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        let popupContent = `<strong>${properties?.IncidentName || 'Unnamed Incident'}</strong><br>`;
        if (properties?.FireDiscoveryDateTime) {
          popupContent += `Discovered: ${new Date(properties.FireDiscoveryDateTime).toLocaleString()}<br>`;
        }
        if (properties?.IncidentSize !== null && properties?.IncidentSize !== undefined) {
          popupContent += `Size: ${properties.IncidentSize.toLocaleString()} acres<br>`;
        }
        if (properties?.PercentContained !== null && properties?.PercentContained !== undefined) {
          popupContent += `Contained: ${properties.PercentContained}%<br>`;
        }
        if (properties?.POOState) {
           popupContent += `State: ${properties.POOState}<br>`;
        }

        new Popup()
          .setLngLat(coordinates)
          .setHTML(popupContent)
          .addTo(currentMap);
      }
    };

    const handleMouseEnter = () => {
        if (currentMap) currentMap.getCanvas().style.cursor = 'pointer';
    };

    const handleMouseLeave = () => {
        if (currentMap) currentMap.getCanvas().style.cursor = '';
    };

    currentMap.on('click', fireLayerId, handleLayerClick);
    currentMap.on('mouseenter', fireLayerId, handleMouseEnter);
    currentMap.on('mouseleave', fireLayerId, handleMouseLeave);

    return () => {
      if (currentMap) {
        currentMap.off('click', fireLayerId, handleLayerClick);
        currentMap.off('mouseenter', fireLayerId, handleMouseEnter);
        currentMap.off('mouseleave', fireLayerId, handleMouseLeave);
        try {
           currentMap.getCanvas().style.cursor = '';
        } catch { /* ignore errors if map canvas is already gone */ }
      }
    };

  }, [activeLayerIds]); 
  
  // Handle clicks on California Fire Perimeters layer
  useEffect(() => {
    if (!map.current) return; 
    const currentMap = map.current;
    const firePerimetersLayerId = 'california-fire-perimeters-layer'; 

    const handleFirePerimetersClick = (e: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const properties = feature.properties;
        
        if (!properties) return;
        
        // Use the click point as the popup location
        const coordinates = [e.lngLat.lng, e.lngLat.lat] as [number, number];

        let popupContent = `<div class="p-2">`;
        popupContent += `<strong>${properties.FIRE_NAME || 'Unnamed Fire'}</strong><br>`;
        
        if (properties.YEAR_) {
          popupContent += `<strong>Year:</strong> ${properties.YEAR_}<br>`;
        }
        
        if (properties.GIS_ACRES) {
          popupContent += `<strong>Size:</strong> ${Number(properties.GIS_ACRES).toLocaleString()} acres<br>`;
        }
        
        if (properties.ALARM_DATE) {
          const alarmDate = new Date(properties.ALARM_DATE);
          popupContent += `<strong>Start Date:</strong> ${alarmDate.toLocaleDateString()}<br>`;
        }
        
        if (properties.CONT_DATE) {
          const contDate = new Date(properties.CONT_DATE);
          popupContent += `<strong>Containment Date:</strong> ${contDate.toLocaleDateString()}<br>`;
        }
        
        if (properties.AGENCY) {
          popupContent += `<strong>Agency:</strong> ${properties.AGENCY}<br>`;
        }
        
        if (properties.CAUSE !== null && properties.CAUSE !== undefined) {
          const causes = {
            1: 'Lightning',
            2: 'Equipment Use',
            3: 'Smoking',
            4: 'Campfire',
            5: 'Debris',
            6: 'Railroad',
            7: 'Arson',
            8: 'Playing with fire',
            9: 'Miscellaneous',
            10: 'Vehicle',
            11: 'Powerline',
            12: 'Firefighter Training',
            13: 'Non-Firefighter Training',
            14: 'Unknown / Unidentified',
            15: 'Structure',
            16: 'Aircraft',
            17: 'Volcanic',
            18: 'Escaped Prescribed Burn',
            19: 'Illegal Alien Campfire'
          };
          const causeText = causes[properties.CAUSE as keyof typeof causes] || `Unknown (${properties.CAUSE})`;
          popupContent += `<strong>Cause:</strong> ${causeText}<br>`;
        }
        
        popupContent += `</div>`;

        new Popup()
          .setLngLat(coordinates)
          .setHTML(popupContent)
          .addTo(currentMap);
      }
    };

    const handleMouseEnter = () => {
        if (currentMap) currentMap.getCanvas().style.cursor = 'pointer';
    };

    const handleMouseLeave = () => {
        if (currentMap) currentMap.getCanvas().style.cursor = '';
    };

    currentMap.on('click', firePerimetersLayerId, handleFirePerimetersClick);
    currentMap.on('mouseenter', firePerimetersLayerId, handleMouseEnter);
    currentMap.on('mouseleave', firePerimetersLayerId, handleMouseLeave);

    return () => {
      if (currentMap) {
        currentMap.off('click', firePerimetersLayerId, handleFirePerimetersClick);
        currentMap.off('mouseenter', firePerimetersLayerId, handleMouseEnter);
        currentMap.off('mouseleave', firePerimetersLayerId, handleMouseLeave);
        try {
           currentMap.getCanvas().style.cursor = '';
        } catch { /* ignore errors if map canvas is already gone */ }
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current) return; 
    const currentMap = map.current;
    const fireLayerId = 'us-fire-events-wfigs-layer'; 

    const handleLayerClick = (e: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const properties = feature.properties;
        const geometry = feature.geometry;

        if (geometry?.type !== 'Point') {
            console.warn("Clicked feature geometry is not a Point:", geometry);
            return; 
        }

        const coordinates = geometry.coordinates.slice() as [number, number]; 

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        let popupContent = `<strong>${properties?.IncidentName || 'Unnamed Incident'}</strong><br>`;
        if (properties?.FireDiscoveryDateTime) {
          popupContent += `Discovered: ${new Date(properties.FireDiscoveryDateTime).toLocaleString()}<br>`;
        }
        if (properties?.IncidentSize !== null && properties?.IncidentSize !== undefined) {
          popupContent += `Size: ${properties.IncidentSize.toLocaleString()} acres<br>`;
        }
        if (properties?.PercentContained !== null && properties?.PercentContained !== undefined) {
          popupContent += `Contained: ${properties.PercentContained}%<br>`;
        }
        if (properties?.POOState) {
           popupContent += `State: ${properties.POOState}<br>`;
        }

        new Popup()
          .setLngLat(coordinates)
          .setHTML(popupContent)
          .addTo(currentMap);
      }
    };

    const handleMouseEnter = () => {
        if (currentMap) currentMap.getCanvas().style.cursor = 'pointer';
    };

    const handleMouseLeave = () => {
        if (currentMap) currentMap.getCanvas().style.cursor = '';
    };

    currentMap.on('click', fireLayerId, handleLayerClick);
    currentMap.on('mouseenter', fireLayerId, handleMouseEnter);
    currentMap.on('mouseleave', fireLayerId, handleMouseLeave);

    return () => {
      if (currentMap) {
        currentMap.off('click', fireLayerId, handleLayerClick);
        currentMap.off('mouseenter', fireLayerId, handleMouseEnter);
        currentMap.off('mouseleave', fireLayerId, handleMouseLeave);
        try {
           currentMap.getCanvas().style.cursor = '';
        } catch { /* ignore errors if map canvas is already gone */ }
      }
    };

  }, [activeLayerIds]); 
  
  useEffect(() => {
    if (!map.current) return; 
    const currentMap = map.current;
    const fireLayerId = 'us-fire-events-wfigs-layer'; 

    if (currentMap.getLayer(fireLayerId)) {
        currentMap.setFilter(fireLayerId, [
            ">=", 
            ["coalesce", ["get", "IncidentSize"], 0], 
            minIncidentSize
        ]);
        console.log(`Applied filter: IncidentSize >= ${minIncidentSize}`);
    } else {
        console.log(`Layer ${fireLayerId} not found when trying to apply filter.`);
    }

  }, [minIncidentSize]); 

  useEffect(() => {
    if (!map.current) return;
    const currentMap = map.current;
    const fireSourceId = 'us-fire-events-wfigs-source';
    const fireLayerActive = activeLayerIds.includes('us-fire-events-wfigs');
    let isListenerAttached = false;

    const calculateAndSetRange = () => {
      if (!currentMap) return;
      const source = currentMap.getSource(fireSourceId);
      if (!source) {
        onDataRangeLoad(0, 0);
        return;
      }
      // Ensure source is loaded before querying features
      if (!currentMap.isSourceLoaded(fireSourceId)) {
          return; 
      }
      const features = currentMap.querySourceFeatures(fireSourceId);
      let minSize = Infinity;
      let maxSize = -Infinity;
      let hasFeatures = false;
      features.forEach(feature => {
        const size = feature.properties?.IncidentSize;
        if (typeof size === 'number' && !isNaN(size)) {
          hasFeatures = true;
          minSize = Math.min(minSize, size);
          maxSize = Math.max(maxSize, size);
        }
      });
      if (hasFeatures) {
        onDataRangeLoad(minSize, maxSize);
      } else {
        onDataRangeLoad(0, 0);
      }
    };

    // Renamed handler to reflect the event type
    const handleSourceData = (e: MapSourceDataEvent) => {
      // Check if the event is for our specific source and if it's now loaded
      if (e.sourceId === fireSourceId && e.isSourceLoaded) {
        calculateAndSetRange();
        // Detach listener after successful calculation
        if (currentMap && isListenerAttached) {
          currentMap.off('sourcedata', handleSourceData);
          isListenerAttached = false;
        }
      }
    };

    if (fireLayerActive) {
      const source = currentMap.getSource(fireSourceId);
      if (source && currentMap.isSourceLoaded(fireSourceId)) {
        calculateAndSetRange(); // Calculate immediately
      } else {
        // Source exists but not loaded, or doesn't exist yet.
        // Attach listener for 'sourcedata'
        currentMap.on('sourcedata', handleSourceData);
        isListenerAttached = true;
      }
    } else {
      // Ensure listener is removed if layer becomes inactive
       if (currentMap && isListenerAttached) {
            currentMap.off('sourcedata', handleSourceData);
            isListenerAttached = false; // Update tracker
       }
    }

    // Cleanup function
    return () => {
      if (currentMap && isListenerAttached) {
        currentMap.off('sourcedata', handleSourceData);
      }
    };

  }, [activeLayerIds, onDataRangeLoad]);

  // Track source loading completion
  useEffect(() => {
    if (!map.current) return;
    const currentMap = map.current;
    const firePerimetersSourceId = 'california-fire-perimeters-source';
    
    // Handler for source data loading events
    const handleSourceData = (e: MapSourceDataEvent) => {
      if (e.sourceId === firePerimetersSourceId && e.isSourceLoaded) {
        console.log('Fire perimeters source loaded successfully');
        setIsFirePerimetersLoading(false);
        // Remove listener after source is loaded
        currentMap.off('sourcedata', handleSourceData);
      }
    };
    
    // Add listener for source data events
    if (isFirePerimetersLoading) {
      currentMap.on('sourcedata', handleSourceData);
    }
    
    return () => {
      if (currentMap) {
        currentMap.off('sourcedata', handleSourceData);
      }
    };
  }, [isFirePerimetersLoading]);
  
  // Effect to update the fire perimeters source when filtered data changes
  useEffect(() => {
    if (!map.current || !filteredData || !activeLayerIds.includes('california-fire-perimeters')) return;
    
    const currentMap = map.current;
    const sourceId = 'california-fire-perimeters-source';
    
    // Check if the source exists
    const source = currentMap.getSource(sourceId);
    if (source) {
      console.log('Updating fire perimeters source with filtered data', {
        featureCount: filteredData.features.length
      });
      
      // Update the source data with filtered data
      (source as maplibregl.GeoJSONSource).setData(filteredData);
    }
  }, [filteredData, activeLayerIds]);
  
  // Effect to re-apply asthma data when the layer is active and data is loaded
  useEffect(() => {
    const currentMap = map.current;
    console.log('[Effect asthmaData] Running effect. Has map:', !!currentMap, 'Has asthmaData:', !!asthmaData);
    if (!currentMap || !asthmaData) return;
    
    const sourceId = 'california-county-boundaries-source';
    
    const applyData = () => {
      console.log(`[Effect asthmaData] Source '${sourceId}' loaded, applying asthma data...`);
      applyAsthmaDataToMap(currentMap, asthmaData);
      console.log(`[Effect asthmaData] Finished applying asthma data.`);
    };
    
    const handleSourceData = (e: MapSourceDataEvent) => {
      console.log(`[Effect asthmaData] 'sourcedata' event for sourceId: ${e.sourceId}, isSourceLoaded: ${e.isSourceLoaded}`);
      if (e.sourceId === sourceId && e.isSourceLoaded) {
        applyData();
        // Consider removing listener if data doesn't change: currentMap.off('sourcedata', handleSourceData);
      }
    };
    
    // Check if source is already loaded when effect runs
    if (currentMap.isSourceLoaded(sourceId)) {
      console.log(`[Effect asthmaData] Source '${sourceId}' is already loaded. Applying data directly.`);
      applyData();
    } else {
      console.log(`[Effect asthmaData] Source '${sourceId}' not loaded yet, waiting for 'sourcedata' event.`);
      currentMap.on('sourcedata', handleSourceData);
    }
    
    // Cleanup listener on unmount or when data changes
    return () => {
      currentMap.off('sourcedata', handleSourceData);
    };
  }, [asthmaData]); 
  
  // updateLayers function moved to the top of the component

  // loadAsthmaData function moved to the top of the component

  // Handle clicks on asthma prevalence layer
  useEffect(() => {
    if (!map.current) return; 
    const currentMap = map.current;
    const asthmaLayerId = 'california-asthma-prevalence-layer'; 

    const handleAsthmaClick = (e: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];

      if (feature.layer.id === 'california-asthma-prevalence-layer') {
        // Get feature state synchronously
        const stateId = typeof feature.id === 'number' ? feature.id.toString() : feature.id;
        const featureState = currentMap.getFeatureState({ source: 'california-county-boundaries-source', id: stateId });
        const asthmaRate = featureState?.asthmaRate;
        const countyName = feature.properties?.COUNTY_NAME;

        console.log(`Clicked ${countyName}, ID: ${feature.id}, State:`, featureState); // Add log

        // Create popup content
        const description = `
          <div class="font-sans">
            <strong class="block text-lg">${countyName}</strong>
            <span class="block text-sm text-gray-600">Asthma Rate: ${asthmaRate !== undefined ? `${asthmaRate}%` : 'No data'}</span>
          </div>
        `;

        // Create and add popup
        new Popup()
          .setLngLat(e.lngLat)
          .setHTML(description)
          .addTo(currentMap);
      }
    };

    const handleMouseEnter = () => {
      if (currentMap) currentMap.getCanvas().style.cursor = 'pointer';
    };

    const handleMouseLeave = () => {
      if (currentMap) currentMap.getCanvas().style.cursor = '';
    };

    currentMap.on('click', asthmaLayerId, handleAsthmaClick);
    currentMap.on('mouseenter', asthmaLayerId, handleMouseEnter);
    currentMap.on('mouseleave', asthmaLayerId, handleMouseLeave);

    return () => {
      if (currentMap) {
        currentMap.off('click', asthmaLayerId, handleAsthmaClick);
        currentMap.off('mouseenter', asthmaLayerId, handleMouseEnter);
        currentMap.off('mouseleave', asthmaLayerId, handleMouseLeave);
        try {
          currentMap.getCanvas().style.cursor = '';
        } catch { /* ignore errors if map canvas is already gone */ }
      }
    };
  }, []);

  return (
    <>
      <div ref={mapContainer} className="w-full h-full absolute top-0 left-0" />
      <Legend layers={overlayLayers} activeLayerIds={activeLayerIds} />
      <LoadingIndicator 
        isLoading={isFirePerimetersLoading || isFireDataLoading || isAsthmaDataLoading} 
        message={isAsthmaDataLoading ? "Loading asthma data..." : "Loading California fire perimeters..."} 
      />
    </>
  );
};

export default MapView;
