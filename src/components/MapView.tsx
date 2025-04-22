import React, { useRef, useEffect, useState } from 'react';
import maplibregl, { Map, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapStyles, defaultMapStyle } from '@/config/mapStyles';
import { overlayLayers, getOverlayLayerConfig } from '@/config/overlayLayers'; // Import overlay config

// Define props
interface MapViewProps {
  activeStyleId: string;
  activeLayerIds: string[]; // Add prop for active layers
}

const MapView: React.FC<MapViewProps> = ({ activeStyleId, activeLayerIds }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const [lng] = useState(-98.5795); // Approx center of US
  const [lat] = useState(39.8283);
  const [zoom] = useState(4.5);

  // Find the initial style object based on the activeStyleId prop
  const initialStyle = mapStyles.find(style => style.id === activeStyleId)?.style || defaultMapStyle.style;

  useEffect(() => {
    if (map.current || !mapContainer.current) return; // Initialize map only once and if container exists

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: initialStyle, // Use initial style
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Clean up on unmount
    return () => {
      map.current?.remove();
      map.current = null;
    };
  // Disable eslint warning because initialStyle should only be used on first mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lng, lat, zoom]); // Only re-run if center/zoom change (won't here)

  // Effect to update style when activeStyleId changes
  useEffect(() => {
    if (!map.current) return; // Make sure map is initialized

    const newStyle = mapStyles.find(style => style.id === activeStyleId)?.style;
    if (newStyle) {
      try {
        map.current.setStyle(newStyle);
      } catch (error) {
        console.error("Error setting map style:", error);
        // Potentially show an error message to the user
      }
    }
  }, [activeStyleId]); // Re-run only when activeStyleId changes

  // Effect to add/remove overlay layers when activeLayerIds changes
  useEffect(() => {
    if (!map.current) return; // Make sure map is initialized
    const currentMap = map.current;

    // Ensure the base style is loaded before trying to add layers
    if (!currentMap.isStyleLoaded()) {
        console.log('Base style not loaded yet, delaying layer update.');
        // Wait for the style to load
        currentMap.once('styledata', () => {
            console.log('Base style loaded, applying layer updates.');
            updateLayers(currentMap, activeLayerIds);
        });
        return;
    }

    // If style is already loaded, update layers directly
    updateLayers(currentMap, activeLayerIds);

  }, [activeLayerIds]); // Re-run only when activeLayerIds changes

  // Helper function to manage layer updates
  const updateLayers = (currentMap: Map, currentActiveLayerIds: string[]) => {
    overlayLayers.forEach(layerConfig => {
      // Use the defined sourceId and layerId
      const layerId = layerConfig.layer.id;
      const sourceId = layerConfig.sourceId; 

      const layerIsActive = currentActiveLayerIds.includes(layerConfig.id);
      const layerExists = currentMap.getLayer(layerId);
      const sourceExists = currentMap.getSource(sourceId);

      // Skip placeholders entirely for now
      if (layerConfig.type === 'placeholder') return;

      if (layerIsActive && !layerExists) {
        // Add Source if it doesn't exist AND a definition is provided
        if (!sourceExists && layerConfig.sourceDefinition) {
          try {
            console.log(`Adding source: ${sourceId} with definition type: ${typeof layerConfig.sourceDefinition}`);
            let sourceSpecToAdd: any;

            if (typeof layerConfig.sourceDefinition === 'string') {
              // Handle simple URL source - ensure type is compatible
              if (layerConfig.type === 'geojson' || layerConfig.type === 'vector' || layerConfig.type === 'raster') {
                // These types accept a URL directly via the 'data' or 'tiles' property
                if (layerConfig.type === 'raster') {
                    sourceSpecToAdd = { type: 'raster', tiles: [layerConfig.sourceDefinition], tileSize: 256 }; // Basic raster tile setup
                } else {
                    // Assuming GeoJSON or Vector Tiles URL
                    sourceSpecToAdd = { type: layerConfig.type, data: layerConfig.sourceDefinition }; 
                }
              } else {
                console.error(`Source definition for ${sourceId} is a string, but type is ${layerConfig.type} which requires an object definition.`);
                return; // Cannot add source
              }
            } else {
              // Handle full SourceSpecification object
              sourceSpecToAdd = layerConfig.sourceDefinition;
            }

            // Type assertion needed because addSource type definition is broad
            currentMap.addSource(sourceId, sourceSpecToAdd); 

          } catch (error) {
            console.error(`Error adding source ${sourceId}:`, error);
            return; // Don't try to add layer if source failed
          }
        }
        
        // Add Layer (check source existence again, could have failed above)
        if (currentMap.getSource(sourceId)) {
            try {
                console.log(`Adding layer: ${layerId} for source: ${sourceId}`);
                // Add safety check: layer spec must have a source field that matches our sourceId
                if ('source' in layerConfig.layer && layerConfig.layer.source === sourceId) {
                    currentMap.addLayer(layerConfig.layer);
                } else if (!('source' in layerConfig.layer)) {
                    // Handle layers without a source (like background - though unlikely for overlays)
                    console.warn(`Layer ${layerId} does not have a source property.`);
                    // currentMap.addLayer(layerConfig.layer);
                } else {
                    console.error(`Layer ${layerId} source property ('${(layerConfig.layer as any).source}') does not match configured sourceId ('${sourceId}')`);
                }
            } catch (error) {
              console.error(`Error adding layer ${layerId}:`, error);
            }
        } else {
            // Source doesn't exist (either wasn't defined or failed to add)
            // We might need to wait for source to load if it was added just now
            console.warn(`Source ${sourceId} not available when attempting to add layer ${layerId}. Waiting for 'sourcedata'...`);
            currentMap.once('sourcedata', (e) => {
                if (e.sourceId === sourceId && e.isSourceLoaded && currentMap.getSource(sourceId)) {
                    console.log(`Source ${sourceId} loaded after delay, adding layer ${layerId}`);
                    if (!currentMap.getLayer(layerId) && 'source' in layerConfig.layer && layerConfig.layer.source === sourceId) {
                         try {
                            currentMap.addLayer(layerConfig.layer);
                         } catch (error) {
                            console.error(`Error adding layer ${layerId} after sourcedata event:`, error);
                         }
                    }
                }
            });
        }
      } else if (!layerIsActive && layerExists) {
        // --- Remove Layer and Source --- 
        // Remove Layer first
        try {
          console.log(`Removing layer: ${layerId}`);
          currentMap.removeLayer(layerId);
        } catch (error) {
          console.error(`Error removing layer ${layerId}:`, error);
        }

        // Remove Source if it exists and is no longer needed by other active layers
        if (sourceExists) {
            const sourceUsedByOtherLayers = overlayLayers.some(otherLayer => 
                otherLayer.id !== layerConfig.id && // Not the current layer
                otherLayer.type !== 'placeholder' && // Not a placeholder
                currentActiveLayerIds.includes(otherLayer.id) && // Is active
                otherLayer.sourceId === sourceId // Uses the same source ID
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
