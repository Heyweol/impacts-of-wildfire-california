import { SourceSpecification, LayerSpecification } from 'maplibre-gl';

// Define the structure for an overlay layer configuration
export interface OverlayLayerConfig {
  id: string;                        // Unique identifier for the *concept* of the layer (e.g., 'us-states')
  name: string;                      // Display name for the layer switcher
  type: 'geojson' | 'raster' | 'vector' | 'wms' | 'placeholder'; // Type of layer data source
  sourceId: string;                  // Unique ID for the MapLibre source (e.g., 'us-states-source')
  sourceDefinition?: SourceSpecification | string; // MapLibre source specification OR URL (only for raster/vector/geojson)
  layer: LayerSpecification;         // MapLibre layer specification for styling (MUST reference sourceId)
  visibleInitially: boolean;        // Whether the layer is visible by default
  initiallyVisible?: boolean;        // Whether the layer is visible by default
  legend?: {                         // Optional legend configuration
    type: 'basic' | 'gradient' | 'custom';
    // Add more legend properties as needed
  };
  legendUrl?: string;                // Optional URL for a legend image (e.g., WMS GetLegendGraphic)
  // Add other potential properties like description, attribution, minZoom, maxZoom etc.
}

// Define the available overlay layers
export const overlayLayers: OverlayLayerConfig[] = [
  {
    id: 'us-states-outlines',
    name: 'US State Outlines',
    type: 'geojson',
    sourceId: 'us-states-outlines-source', // Explicit source ID
    // Source Definition: URL for GeoJSON
    sourceDefinition: 'https://maplibre.org/maplibre-gl-js/docs/assets/us_states.geojson',
    layer: {
      id: 'us-states-outlines-layer',
      type: 'line',
      source: 'us-states-outlines-source', // Layer spec MUST reference sourceId
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#007cbf',
        'line-width': 1
      }
    },
    visibleInitially: false, 
    initiallyVisible: false, // Start hidden
  },
  {
    id: 'california-county-boundaries',
    name: 'California County Boundaries',
    type: 'geojson',
    sourceId: 'california-county-boundaries-source',
    sourceDefinition: '/California_County_Boundaries_simplified.json',
    layer: {
      id: 'california-county-boundaries-layer',
      type: 'line',
      source: 'california-county-boundaries-source',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#FF8C00',
        'line-width': 1
      }
    },
    visibleInitially: true, // Always visible
    initiallyVisible: true, // Always visible
  },

 ];

 // Helper to get a layer config by ID
export const getOverlayLayerConfig = (id: string): OverlayLayerConfig | undefined => {
  return overlayLayers.find(layer => layer.id === id);
};
