# Development Stage (2025-04-21)

## Project Setup

*   **Framework:** Next.js (App Router)
*   **Package Manager:** pnpm
*   **Styling:** Tailwind CSS v4 (using `@tailwindcss/postcss`)
*   **Language:** TypeScript
*   **Linting:** ESLint configured
*   **Directory Structure:** `src/` directory used

## Core Features Implemented

*   **Basic Map Display:**
    *   Integrated MapLibre GL JS.
    *   Created a reusable `MapView` component (`src/components/MapView.tsx`).
    *   Dynamically loaded the map component using a client-side wrapper (`src/components/MapWrapper.tsx`) to avoid SSR issues.
    *   The map fills the entire screen.
    *   Centered the map view on the continental United States.
    *   Uses OpenStreetMap as the base tile layer.
    *   Added basic navigation controls (zoom, rotation).
*   **UI Elements:**
    *   Added a floating vertical `Toolbar` component (`src/components/Toolbar.tsx`) on the left side with placeholder buttons.

## Stage 2: Basemap Switching & Initial Overlay Layers

- **Timestamp:** 2025-04-21
- **Features Added:**
  - **Basemap Switcher:**
    - Created `src/config/mapStyles.ts` to define different basemap styles (OSM Raster, Terrain, ESRI Satellite).
    - Created `src/components/BasemapSwitcher.tsx` component with UI to select styles.
    - Integrated `BasemapSwitcher` into `Toolbar.tsx`, controlled by the first button (Globe icon).
    - Added state in `page.tsx` to manage the active basemap style ID.
    - Updated `MapView.tsx` to accept the active style ID and update the map's style accordingly.
    - Resolved initial issue where the default 'Streets' style was too basic by switching it to use standard OSM raster tiles.
  - **Overlay Layer System:**
    - Created `src/config/overlayLayers.ts` to define overlay layers (structure includes ID, name, type, source ID, source definition, layer specification).
    - Added initial layers: Placeholder for 'Active Fire Perimeters' and functional 'US State Outlines' using GeoJSON.
    - Created `src/components/LayerSwitcher.tsx` component with checkboxes to toggle layer visibility.
    - Integrated `LayerSwitcher` into `Toolbar.tsx`, controlled by the second button (Layers icon).
    - Added state in `page.tsx` (`activeLayerIds`) to track visible overlays.
    - Passed overlay state down through `Toolbar` and `MapWrapper`.
    - Implemented logic in `MapView.tsx` using a `useEffect` hook to dynamically add/remove MapLibre sources and layers based on the `activeLayerIds` state, handling dependencies and potential race conditions with style/source loading.
- **Resolved Issues:**
    - Corrected all TypeScript prop type errors related to passing state down through components (`page.tsx`, `Toolbar.tsx`, `MapWrapper.tsx`, `MapView.tsx`).
    - Refined `OverlayLayerConfig` structure and `MapView` logic to correctly handle MapLibre `LayerSpecification` and `SourceSpecification` types.
- **Next Steps:**
    - Add more overlay layers (e.g., weather, wind, fire data from actual sources).
    - Implement legend display for active overlays.
    - Refine UI/UX for toolbar and switchers.
    - Begin work on spatial-temporal analysis features.

## Stage 3: Integration of External Data Sources (NWS Radar)

- **Timestamp:** 2025-04-21
- **Features Added:**
  - **NWS Radar Layer:**
    - Identified the NWS Cloud GIS Webservices page ([https://www.weather.gov/gis/cloudgiswebservices](https://www.weather.gov/gis/cloudgiswebservices)) as a potential source.
    - Extracted the WMS endpoint for radar: `https://opengeo.ncep.noaa.gov/geoserver/wms`.
    - Added configuration for the NWS Radar WMS layer (`radar_lite_composite_15min`) to `src/config/overlayLayers.ts`.
    - The layer is now available for toggling in the `LayerSwitcher` component.
  - **Correction (2025-04-21):** Encountered `InvalidStateError: The source image could not be decoded` error in the browser console, indicating an invalid WMS layer parameter.
    - Investigated the GeoServer instance (`https://opengeo.ncep.noaa.gov/geoserver/www/index.html`) linked from the NWS GIS page.
    - Identified the correct layer name for CONUS Base Reflectivity as `conus_bref_qcd`.
    - Updated `src/config/overlayLayers.ts` with the correct layer name.
  - **Legend Display:**
    - Added optional `legendUrl` property to `OverlayLayerConfig` interface in `src/config/overlayLayers.ts`.
    - Added the WMS `GetLegendGraphic` URL for the NWS Radar layer.
    - Created a new `Legend` component (`src/components/Legend.tsx`) to display legends for active layers with a defined `legendUrl`.
    - Integrated the `Legend` component into `src/app/page.tsx`, positioned at the bottom-right.
    - Fixed a TypeScript error by ensuring `visibleInitially` property exists in the `OverlayLayerConfig` interface.
  - **Added More NWS Radar Layers:**
    - Added configurations to `src/config/overlayLayers.ts` for:
      - NWS Radar (CONUS Comp. Refl.) - Layer: `conus_cref_qcd`
      - NWS Radar (CONUS Echo Tops) - Layer: `conus_neet_v18`
      - NWS Radar (CONUS Precip. Type) - Layer: `conus_pcpn_typ`
    - Included corresponding `GetLegendGraphic` URLs for each new layer.
  - **NWS WMS API Usage Note:**
    - The NWS WMS service (`https://opengeo.ncep.noaa.gov/geoserver/wms`) follows OGC WMS standards.
    - Key parameters for `GetMap` requests (used for map tiles):
      - `SERVICE=WMS`, `REQUEST=GetMap`
      - `LAYERS`: The specific layer identifier (e.g., `conus_bref_qcd`).
      - `FORMAT=image/png` (or other desired format).
      - `TRANSPARENT=true` (for overlaying).
      - `VERSION` (e.g., `1.1.1` or `1.3.0`).
      - `WIDTH=256`, `HEIGHT=256` (tile size).
      - `SRS` (Spatial Reference System, e.g., `EPSG:3857` for web maps).
      - `BBOX`: Bounding box coordinates matching the SRS (MapLibre substitutes `{bbox-epsg-3857}`).
      - `STYLES`: Optional style name (often blank for default).
    - Key parameters for `GetLegendGraphic` requests:
      - `SERVICE=WMS`, `REQUEST=GetLegendGraphic`
      - `LAYER`: The layer identifier.
      - `FORMAT=image/png`.
      - `VERSION`.
  - **Added NDFD Temperature Layers:**
    - Added 5 forecast temperature layers (Max/Min Day 1-2, Max Day 3) from the NDFD Temperature WMS service (`https://mapservices.weather.noaa.gov/raster/services/NDFD/NDFD_temp/MapServer/WMSServer`) to `src/config/overlayLayers.ts`.
    - Used the numeric layer IDs identified from the service's GetCapabilities document (e.g., `6` for Min Temp D1, `19` for Max Temp D1).
    - Included corresponding `GetLegendGraphic` URLs using the numeric layer IDs.
    - **Note:** This WMS service uses numeric layer IDs instead of descriptive names found in some other NWS WMS services.
- **Next Steps:**
    - Verify the radar layer displays correctly on the map.
    - Verify the radar legend displays correctly when the layer is active.
    - Verify the newly added radar layers and their legends display correctly.
    - Verify the NDFD temperature layers and their legends display correctly.
    - Investigate other layers available from the NWS WMS service.
    - Add more relevant wildfire/environmental data layers.
    - Consider adding functionality to ensure only one radar layer is active at a time (optional).

## Stage 3: Integrate Live Wildfire Data (NIFC)

*   **Goal:** Fetch and display live US wildfire incidents from the National Interagency Fire Center (NIFC).
*   **Progress:**
    *   Added a 'US Fire Events' button and layer configuration placeholder in `overlayLayers.ts`.
    *   Researched NIFC data sources (Open Data Portal, ArcGIS Hub).
    *   Attempted to find the Feature Service API endpoint (details omitted for brevity).
    *   **Successfully located the Feature Service URL by querying the ArcGIS item metadata endpoint:** `https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations_YearToDate/FeatureServer`.
    *   Updated `overlayLayers.ts` with the correct URL and refactored to use MapLibre GeoJSON format (instead of Leaflet FeatureLayer).
    *   Commented out 'Past Incidents (USGS)' layer in `overlayLayers.ts` due to CORS errors preventing client-side fetching.
    *   Implemented click popups in `MapView.tsx` for the 'US Fire Events (WFIGS)' layer, showing incident details (Name, Size, Discovered, Contained, State).
    *   Updated documentation (`files.md`, `development_stage.md`).
*   **Next Steps:**
    *   Test the 'US Fire Events (WFIGS)' button and popup functionality.
    *   Refine the marker style (use a proper fire icon instead of basic circles if desired).
    *   Update the map legend (`Legend.tsx`) to include an entry for fire events.
    *   Consider performance implications of loading potentially many features (e.g., use clustering or filtering).
    *   Revisit 'Past Incidents' later if needed, likely requiring a server-side fetch approach.

## Next Steps

*   Implement header/navigation.
*   Add sidebar for controls/layers.
*   Integrate wildfire data sources.
*   Refine map styling and base layers (potentially using an API key for better styles).
