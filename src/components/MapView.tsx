import React, { useRef, useEffect, useState } from 'react';
import maplibregl, { Map, MapMouseEvent, MapGeoJSONFeature, Popup, MapSourceDataEvent, SourceSpecification, LayerSpecification } from 'maplibre-gl'; 
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapStyles, defaultMapStyle } from '@/config/mapStyles';
import { overlayLayers } from '@/config/overlayLayers'; 
import { useFireData } from '@/contexts/FireDataContext';
import Legend from './Legend';
import LoadingIndicator from './LoadingIndicator';

// Define props
interface MapViewProps {
  activeStyleId: string;
  activeLayerIds: string[];
  minIncidentSize: number; 
  onDataRangeLoad: (min: number, max: number) => void; 
}

const MapView: React.FC<MapViewProps> = ({ 
  activeStyleId, 
  activeLayerIds, 
  minIncidentSize, 
  onDataRangeLoad 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  // California coordinates (centered on the state)
  const [lng] = useState(-119.4179); 
  const [lat] = useState(37.1666);
  const [zoom] = useState(5.5); // Closer zoom level for California
  
  // Track loading states for specific layers
  const [isFirePerimetersLoading, setIsFirePerimetersLoading] = useState(false);
  
  // Get filtered fire data from context
  const { filteredData, isLoading: isFireDataLoading } = useFireData();

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

    // Find the new style
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
  }, [activeStyleId]); 

  useEffect(() => {
    if (!map.current) return; 
    const currentMap = map.current;

    // Check if fire perimeters layer is being activated
    const wasFirePerimetersActive = activeLayerIds.includes('california-fire-perimeters');
    
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

    updateLayers(currentMap, activeLayerIds);

  }, [activeLayerIds]); 

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

  }, []); 
  
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
  
  const updateLayers = (currentMap: Map, currentActiveLayerIds: string[]) => {
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
  }

  return (
    <>
      <div ref={mapContainer} className="w-full h-full absolute top-0 left-0" />
      <Legend layers={overlayLayers} activeLayerIds={activeLayerIds} />
      <LoadingIndicator 
        isLoading={isFirePerimetersLoading || isFireDataLoading} 
        message="Loading California fire perimeters..." 
      />
    </>
  );
};

export default MapView;
