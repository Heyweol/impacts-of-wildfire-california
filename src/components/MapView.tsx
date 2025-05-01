import React, { useRef, useEffect, useState } from 'react';
import maplibregl, { Map, MapMouseEvent, MapGeoJSONFeature, Popup, MapSourceDataEvent, SourceSpecification, LayerSpecification } from 'maplibre-gl'; 
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapStyles, defaultMapStyle } from '@/config/mapStyles';
import { overlayLayers } from '@/config/overlayLayers'; 

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
  const [lng] = useState(-98.5795); 
  const [lat] = useState(39.8283);
  const [zoom] = useState(4.5);

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

    const newStyle = mapStyles.find(style => style.id === activeStyleId)?.style;
    if (newStyle) {
      try {
        map.current.setStyle(newStyle);
      } catch (error) {
        console.error("Error setting map style:", error);
      }
    }
  }, [activeStyleId]); 

  useEffect(() => {
    if (!map.current) return; 
    const currentMap = map.current;

    if (!currentMap.isStyleLoaded()) {
        console.log('Base style not loaded yet, delaying layer update.');
        currentMap.once('styledata', () => {
            console.log('Base style loaded, applying layer updates.');
            updateLayers(currentMap, activeLayerIds);
        });
        return;
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

  return <div ref={mapContainer} className="w-full h-full absolute top-0 left-0" />;
};

export default MapView;
