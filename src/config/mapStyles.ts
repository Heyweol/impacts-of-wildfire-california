import { StyleSpecification } from 'maplibre-gl';

export interface BasemapStyle {
  id: string;
  name: string;
  style: string | StyleSpecification;
}

export const mapStyles: BasemapStyle[] = [
  {
    id: 'maplibre-streets', // Keep ID for simplicity, though source changes
    name: 'Streets',
    // Use OSM Raster Tiles
    style: {
      version: 8,
      sources: {
          'osm-raster-tiles': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution:
                  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              maxzoom: 19 // Standard OSM max zoom
          }
      },
      layers: [
          {
              id: 'osm-raster-layer',
              type: 'raster',
              source: 'osm-raster-tiles'
          }
      ]
    }
  },
  {
    id: 'opentopomap',
    name: 'Terrain',
    style: {
      version: 8,
      sources: {
        'opentopomap-tiles': {
          type: 'raster',
          tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution:
            'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
          maxzoom: 17,
        },
      },
      layers: [
        {
          id: 'opentopomap-layer',
          type: 'raster',
          source: 'opentopomap-tiles',
        },
      ],
    },
  },
  {
    id: 'esri-satellite',
    name: 'Satellite',
    style: {
      version: 8,
      sources: {
        'esri-satellite-tiles': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxzoom: 19
        },
      },
      layers: [
        {
          id: 'esri-satellite-layer',
          type: 'raster',
          source: 'esri-satellite-tiles',
        },
      ],
    },
  }
];

export const defaultMapStyle = mapStyles[0]; // Default to Streets
