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
    id: 'active-fire-perimeters',
    name: 'Active Fire Perimeters',
    type: 'placeholder', // Placeholder - requires a real data source
    sourceId: 'active-fire-perimeters-source', // Define sourceId even for placeholder
    // sourceDefinition is omitted for placeholder
    layer: {
      id: 'active-fire-perimeters-layer',
      type: 'fill',
      source: 'active-fire-perimeters-source', // Layer spec MUST reference sourceId
      paint: {
        'fill-color': '#FF0000',
        'fill-opacity': 0.5
      }
    },
    visibleInitially: false,
    initiallyVisible: false,
  },
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
    id: 'nws-radar',
    name: 'NWS Radar (CONUS Base Refl.)',
    type: 'wms',
    sourceId: 'nws-radar-source',
    sourceDefinition: {
      type: 'raster',
      tiles: [
        'https://opengeo.ncep.noaa.gov/geoserver/wms?service=WMS&request=GetMap&layers=conus_bref_qcd&styles=&format=image/png&transparent=true&version=1.1.1&height=256&width=256&srs=EPSG:3857&bbox={bbox-epsg-3857}',
      ],
      tileSize: 256,
    },
    layer: {
      id: 'nws-radar-layer',
      type: 'raster',
      source: 'nws-radar-source',
      paint: {
        'raster-opacity': 0.7, // Adjust opacity as needed
      },
    },
    visibleInitially: false,
    initiallyVisible: false,
    legendUrl: 'https://opengeo.ncep.noaa.gov/geoserver/wms?SERVICE=WMS&REQUEST=GetLegendGraphic&LAYER=conus_bref_qcd&FORMAT=image/png&VERSION=1.1.1',
  },
  {
    id: 'nws-radar-comp-refl',
    name: 'NWS Radar (CONUS Comp. Refl.)',
    type: 'raster',
    sourceId: 'nws-radar-comp-refl-source',
    sourceDefinition: {
      type: 'raster',
      tiles: [
        'https://opengeo.ncep.noaa.gov/geoserver/wms?service=WMS&request=GetMap&layers=conus_cref_qcd&styles=&format=image/png&transparent=true&version=1.1.1&height=256&width=256&srs=EPSG:3857&bbox={bbox-epsg-3857}',
      ],
      tileSize: 256,
    },
    layer: {
      id: 'nws-radar-comp-refl-layer',
      type: 'raster',
      source: 'nws-radar-comp-refl-source',
      paint: {
        'raster-opacity': 0.7,
      },
    },
    visibleInitially: false,
    legendUrl: 'https://opengeo.ncep.noaa.gov/geoserver/wms?SERVICE=WMS&REQUEST=GetLegendGraphic&LAYER=conus_cref_qcd&FORMAT=image/png&VERSION=1.1.1',
  },
  {
    id: 'nws-radar-echo-tops',
    name: 'NWS Radar (CONUS Echo Tops)',
    type: 'raster',
    sourceId: 'nws-radar-echo-tops-source',
    sourceDefinition: {
      type: 'raster',
      tiles: [
        'https://opengeo.ncep.noaa.gov/geoserver/wms?service=WMS&request=GetMap&layers=conus_neet_v18&styles=&format=image/png&transparent=true&version=1.1.1&height=256&width=256&srs=EPSG:3857&bbox={bbox-epsg-3857}',
      ],
      tileSize: 256,
    },
    layer: {
      id: 'nws-radar-echo-tops-layer',
      type: 'raster',
      source: 'nws-radar-echo-tops-source',
      paint: {
        'raster-opacity': 0.7,
      },
    },
    visibleInitially: false,
    legendUrl: 'https://opengeo.ncep.noaa.gov/geoserver/wms?SERVICE=WMS&REQUEST=GetLegendGraphic&LAYER=conus_neet_v18&FORMAT=image/png&VERSION=1.1.1',
  },
  {
    id: 'nws-radar-precip-type',
    name: 'NWS Radar (CONUS Precip. Type)',
    type: 'raster',
    sourceId: 'nws-radar-precip-type-source',
    sourceDefinition: {
      type: 'raster',
      tiles: [
        'https://opengeo.ncep.noaa.gov/geoserver/wms?service=WMS&request=GetMap&layers=conus_pcpn_typ&styles=&format=image/png&transparent=true&version=1.1.1&height=256&width=256&srs=EPSG:3857&bbox={bbox-epsg-3857}',
      ],
      tileSize: 256,
    },
    layer: {
      id: 'nws-radar-precip-type-layer',
      type: 'raster',
      source: 'nws-radar-precip-type-source',
      paint: {
        'raster-opacity': 0.7,
      },
    },
    visibleInitially: false,
    legendUrl: 'https://opengeo.ncep.noaa.gov/geoserver/wms?SERVICE=WMS&REQUEST=GetLegendGraphic&LAYER=conus_pcpn_typ&FORMAT=image/png&VERSION=1.1.1',
  },
  // --- NDFD Temperature Layers ---
  {
    id: 'ndfd-temp-max-d1',
    name: 'NDFD Max Temp Day 1 (F)',
    type: 'raster',
    sourceId: 'ndfd-temp-max-d1-source',
    sourceDefinition: {
      type: 'raster',
      tiles: [
        'https://mapservices.weather.noaa.gov/raster/services/NDFD/NDFD_temp/MapServer/WMSServer?service=WMS&request=GetMap&layers=19&styles=&format=image/png&transparent=true&version=1.3.0&height=256&width=256&crs=EPSG:3857&bbox={bbox-epsg-3857}',
      ],
      tileSize: 256,
    },
    layer: {
      id: 'ndfd-temp-max-d1-layer',
      type: 'raster',
      source: 'ndfd-temp-max-d1-source',
      paint: {
        'raster-opacity': 0.7,
      },
    },
    visibleInitially: false,
    legendUrl: 'https://mapservices.weather.noaa.gov/raster/services/NDFD/NDFD_temp/MapServer/WMSServer?request=GetLegendGraphic&version=1.3.0&format=image/png&layer=19',
  },
  {
    id: 'ndfd-temp-min-d1',
    name: 'NDFD Min Temp Day 1 (F)',
    type: 'raster',
    sourceId: 'ndfd-temp-min-d1-source',
    sourceDefinition: {
      type: 'raster',
      tiles: [
        'https://mapservices.weather.noaa.gov/raster/services/NDFD/NDFD_temp/MapServer/WMSServer?service=WMS&request=GetMap&layers=6&styles=&format=image/png&transparent=true&version=1.3.0&height=256&width=256&crs=EPSG:3857&bbox={bbox-epsg-3857}',
      ],
      tileSize: 256,
    },
    layer: {
      id: 'ndfd-temp-min-d1-layer',
      type: 'raster',
      source: 'ndfd-temp-min-d1-source',
      paint: {
        'raster-opacity': 0.7,
      },
    },
    visibleInitially: false,
    legendUrl: 'https://mapservices.weather.noaa.gov/raster/services/NDFD/NDFD_temp/MapServer/WMSServer?request=GetLegendGraphic&version=1.3.0&format=image/png&layer=6',
  },
  {
    id: 'ndfd-temp-max-d2',
    name: 'NDFD Max Temp Day 2 (F)',
    type: 'raster',
    sourceId: 'ndfd-temp-max-d2-source',
    sourceDefinition: {
      type: 'raster',
      tiles: [
        'https://mapservices.weather.noaa.gov/raster/services/NDFD/NDFD_temp/MapServer/WMSServer?service=WMS&request=GetMap&layers=15&styles=&format=image/png&transparent=true&version=1.3.0&height=256&width=256&crs=EPSG:3857&bbox={bbox-epsg-3857}',
      ],
      tileSize: 256,
    },
    layer: {
      id: 'ndfd-temp-max-d2-layer',
      type: 'raster',
      source: 'ndfd-temp-max-d2-source',
      paint: {
        'raster-opacity': 0.7,
      },
    },
    visibleInitially: false,
    legendUrl: 'https://mapservices.weather.noaa.gov/raster/services/NDFD/NDFD_temp/MapServer/WMSServer?request=GetLegendGraphic&version=1.3.0&format=image/png&layer=15',
  },
  {
    id: 'ndfd-temp-min-d2',
    name: 'NDFD Min Temp Day 2 (F)',
    type: 'raster',
    sourceId: 'ndfd-temp-min-d2-source',
    sourceDefinition: {
      type: 'raster',
      tiles: [
        'https://mapservices.weather.noaa.gov/raster/services/NDFD/NDFD_temp/MapServer/WMSServer?service=WMS&request=GetMap&layers=2&styles=&format=image/png&transparent=true&version=1.3.0&height=256&width=256&crs=EPSG:3857&bbox={bbox-epsg-3857}',
      ],
      tileSize: 256,
    },
    layer: {
      id: 'ndfd-temp-min-d2-layer',
      type: 'raster',
      source: 'ndfd-temp-min-d2-source',
      paint: {
        'raster-opacity': 0.7,
      },
    },
    visibleInitially: false,
    legendUrl: 'https://mapservices.weather.noaa.gov/raster/services/NDFD/NDFD_temp/MapServer/WMSServer?request=GetLegendGraphic&version=1.3.0&format=image/png&layer=2',
  },
  {
    id: 'ndfd-temp-max-d3',
    name: 'NDFD Max Temp Day 3 (F)',
    type: 'raster',
    sourceId: 'ndfd-temp-max-d3-source',
    sourceDefinition: {
      type: 'raster',
      tiles: [
        'https://mapservices.weather.noaa.gov/raster/services/NDFD/NDFD_temp/MapServer/WMSServer?service=WMS&request=GetMap&layers=11&styles=&format=image/png&transparent=true&version=1.3.0&height=256&width=256&crs=EPSG:3857&bbox={bbox-epsg-3857}',
      ],
      tileSize: 256,
    },
    layer: {
      id: 'ndfd-temp-max-d3-layer',
      type: 'raster',
      source: 'ndfd-temp-max-d3-source',
      paint: {
        'raster-opacity': 0.7,
      },
    },
    visibleInitially: false,
    legendUrl: 'https://mapservices.weather.noaa.gov/raster/services/NDFD/NDFD_temp/MapServer/WMSServer?request=GetLegendGraphic&version=1.3.0&format=image/png&layer=11',
  },
  // --- Add more layers here ---
  // Example: Weather Radar (requires a TileJSON or WMS source)
  // {
  //   id: 'weather-radar',
  //   name: 'Weather Radar',
  //   type: 'raster', // or 'wms'
  //   sourceId: 'weather-radar-source',
  //   sourceDefinition: { // MUST be a SourceSpecification object for WMS or complex raster
  //     type: 'raster',
  //     tiles: ['URL_TO_WEATHER_RADAR_TILES/{z}/{x}/{y}.png'], // Replace with actual URL
  //     tileSize: 256,
  //     attribution: 'Source Attribution',
  //   },
  //   layer: {
  //     id: 'weather-radar-layer',
  //     type: 'raster',
  //     source: 'weather-radar-source', // Must match the sourceId
  //     paint: {
  //       'raster-opacity': 0.7
  //     }
  //   },
  //   visibleInitially: false,
  //   initiallyVisible: false,
  // },
  {
    id: 'us-fire-events-wfigs',
    name: 'US Fire Events (WFIGS)',
    type: 'geojson',
    sourceId: 'us-fire-events-wfigs-source',
    // Source: ArcGIS Feature Service query returning GeoJSON for 2025 incidents
    sourceDefinition: 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations_YearToDate/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson',
    layer: {
      id: 'us-fire-events-wfigs-layer',
      type: 'circle', // Use circle markers for points
      source: 'us-fire-events-wfigs-source',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'IncidentSize'], // Adjust radius based on IncidentSize property
          0, 2,    // Size 0 acres -> radius 2
          100, 4,  // Size 100 acres -> radius 4
          1000, 8, // Size 1000 acres -> radius 8
          10000, 12 // Size 10000+ acres -> radius 12
        ],
        'circle-color': '#FF4500', // Orangey-red color for fire
        'circle-opacity': 0.7,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#FFFFFF'
      }
      // Note: Popups need to be handled separately using map.on('click', layerId, ...)
    },
    visibleInitially: false,
    // requiresTime: false // Future: could filter by FireDiscoveryDateTime
  },
  // {
  //   id: 'pastIncidents-usgs',
  //   name: 'Past Incidents (USGS - Last Year)',
  //   type: 'geojson',
  //   sourceId: 'pastIncidents-usgs-source',
  //   // NOTE: This USGS endpoint (https://wildfire.cr.usgs.gov/...) frequently causes CORS errors
  //   // when accessed directly from a browser client.
  //   // It's likely not configured to allow cross-origin requests from web applications.
  //   // To use this data, it would likely need to be fetched server-side (e.g., via a Next.js API route)
  //   // or through a dedicated CORS proxy.
  //   sourceDefinition: 'https://wildfire.cr.usgs.gov/arcgis/rest/services/geojson/USGS_Wildfires_Past_Year/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson',
  //   layer: {
  //     id: 'pastIncidents-usgs-layer',
  //     type: 'circle',
  //     source: 'pastIncidents-usgs-source',
  //     paint: {
  //       'circle-color': '#FFA07A', // Light Salmon color
  //       'circle-radius': [
  //         'interpolate',
  //         ['linear'],
  //         ['get', 'IncidentSize'], // Example: Adjust radius based on size if available
  //         0, 2,
  //         100, 4,
  //         1000, 8,
  //         10000, 12
  //       ],
  //       'circle-opacity': 0.6,
  //     }
  //   },
  //   visibleInitially: false,
  // },
 ];

 // Helper to get a layer config by ID
export const getOverlayLayerConfig = (id: string): OverlayLayerConfig | undefined => {
  return overlayLayers.find(layer => layer.id === id);
};
