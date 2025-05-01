import { SourceSpecification, LayerSpecification } from 'maplibre-gl';

// Define the structure for an overlay layer configuration
export interface LegendItem {
  label: string;
  color: string;
}

export interface LegendConfig {
  type: 'basic' | 'gradient' | 'custom';
  title?: string;
  items?: LegendItem[];
}

export interface OverlayLayerConfig {
  id: string;                        // Unique identifier for the *concept* of the layer (e.g., 'us-states')
  name: string;                      // Display name for the layer switcher
  type: 'geojson' | 'raster' | 'vector' | 'wms' | 'placeholder'; // Type of layer data source
  sourceId: string;                  // Unique ID for the MapLibre source (e.g., 'us-states-source')
  sourceDefinition?: SourceSpecification | string; // MapLibre source specification OR URL (only for raster/vector/geojson)
  layer: LayerSpecification;         // MapLibre layer specification for styling (MUST reference sourceId)
  visibleInitially: boolean;        // Whether the layer is visible by default
  initiallyVisible?: boolean;        // Whether the layer is visible by default
  legend?: LegendConfig;             // Optional legend configuration
  legendUrl?: string;                // Optional URL for a legend image (e.g., WMS GetLegendGraphic)
  metadata?: {                       // Optional metadata for additional layer properties
    requiresYearSelection?: boolean; // Whether this layer requires year selection
    [key: string]: unknown;          // Allow for other metadata properties (avoid explicit any)
  };
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
    sourceDefinition: {
      type: 'geojson',
      data: '/California_County_Boundaries_simplified.json',
      promoteId: 'COUNTY_NAME'
    },
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
  {
    id: 'california-fire-perimeters',
    name: 'California Fire Perimeters (2018+)',
    type: 'geojson',
    sourceId: 'california-fire-perimeters-source',
    sourceDefinition: {
      type: 'geojson',
      data: 'https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/California_Historic_Fire_Perimeters/FeatureServer/0/query?where=YEAR_>=2018&outFields=*&f=geojson&outSR=4326&resultRecordCount=2000',
      generateId: true
    },
    layer: {
      id: 'california-fire-perimeters-layer',
      type: 'fill',
      source: 'california-fire-perimeters-source',
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'YEAR_'],
          2018, '#FFC107',
          2019, '#FF9800',
          2020, '#FF5722',
          2021, '#E91E63',
          2022, '#9C27B0',
          2023, '#673AB7'
        ],
        'fill-opacity': 0.7,
        'fill-outline-color': '#000000'
      },
      layout: {
        visibility: 'visible'
      }
    },
    legend: {
      type: 'gradient',
      title: 'Fire Year',
      items: [
        { label: '2018', color: '#FFC107' },
        { label: '2019', color: '#FF9800' },
        { label: '2020', color: '#FF5722' },
        { label: '2021', color: '#E91E63' },
        { label: '2022', color: '#9C27B0' },
        { label: '2023', color: '#673AB7' }
      ]
    },
    visibleInitially: false,
    initiallyVisible: false,
  },
  {
    id: 'california-asthma-prevalence',
    name: 'California Asthma Prevalence',
    type: 'geojson',
    sourceId: 'california-county-boundaries-source', // Uses the same source as county boundaries
    layer: {
      id: 'california-asthma-prevalence-layer',
      type: 'fill',
      source: 'california-county-boundaries-source',
      paint: {
        'fill-color': [
          'step',
          ['coalesce', ['feature-state', 'asthmaRate'], -1],
          '#cccccc',   // -1 (no data)
          0, '#1a9850',   // 0-<7
          7, '#91cf60',   // 7-<9
          9, '#d9ef8b',   // 9-<11
          11, '#fee08b',  // 11-<13
          13, '#fc8d59',  // 13-<15
          15, '#d73027'   // 15+
        ],
        'fill-opacity': 0.7,
        'fill-outline-color': 'transparent' // Keep outline transparent
      },
      layout: {
        visibility: 'visible' // Keep it visible by default, controlled by activeLayerIds
      }
    },
    legend: {
      type: 'gradient',
      title: 'Asthma Prevalence (%)',
      items: [
        { label: '<7%', color: '#1a9850' },
        { label: '7-9%', color: '#91cf60' },
        { label: '9-11%', color: '#d9ef8b' },
        { label: '11-13%', color: '#fee08b' },
        { label: '13-15%', color: '#fc8d59' },
        { label: '>15%', color: '#d73027' },
        { label: 'No data', color: '#cccccc' }
      ]
    },
    visibleInitially: false,
    initiallyVisible: false,
  },
  {
    id: 'california-temperature-anomaly',
    name: 'Temperature Anomaly',
    type: 'geojson',
    sourceId: 'california-county-boundaries-source', // Uses the same source as county boundaries
    layer: {
      id: 'california-temperature-anomaly-layer',
      type: 'fill',
      source: 'california-county-boundaries-source',
      paint: {
        'fill-color': [
          'step',
          ['coalesce', ['feature-state', 'temperatureAnomaly'], -999],
          '#cccccc',   // -999 (no data)
          -1, '#4575b4',  // Cooling
          0, '#91bfdb',   // Slight warming
          1, '#e0f3f8',   // Moderate warming
          2, '#fee090',   // Significant warming
          3, '#fc8d59',   // High warming
          4, '#d73027'    // Extreme warming
        ],
        'fill-opacity': 0.7,
        'fill-outline-color': 'transparent' // Keep outline transparent
      },
      layout: {
        visibility: 'visible' // Keep it visible by default, controlled by activeLayerIds
      }
    },
    legend: {
      type: 'gradient',
      title: 'Temperature Anomaly (°F)',
      items: [
        { label: '<0°F', color: '#4575b4' },
        { label: '0-1°F', color: '#91bfdb' },
        { label: '1-2°F', color: '#e0f3f8' },
        { label: '2-3°F', color: '#fee090' },
        { label: '3-4°F', color: '#fc8d59' },
        { label: '>4°F', color: '#d73027' },
        { label: 'No data', color: '#cccccc' }
      ]
    },
    visibleInitially: false,
    initiallyVisible: false,
    metadata: {
      requiresYearSelection: true
    }
  },
 ];

 // Helper to get a layer config by ID
export const getOverlayLayerConfig = (id: string): OverlayLayerConfig | undefined => {
  return overlayLayers.find(layer => layer.id === id);
};
