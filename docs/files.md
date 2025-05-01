# Project File Structure

This document outlines the key files and directories in the project.

```
fire_web/
├── docs/
│   ├── development_stage.md  # Tracks current development progress
│   └── files.md              # This file: Explains project structure
├── node_modules/             # Project dependencies (managed by pnpm)
├── public/
│   ├── next.svg              # Next.js logo (can be removed)
│   ├── vercel.svg            # Vercel logo (can be removed)
│   ├── asthma-prevalence-18-23.csv  # California asthma prevalence data by county
│   ├── California_County_Boundaries_simplified.json  # GeoJSON for California counties
│   └── ...                   # Other static assets
├── src/
│   ├── app/
│   │   ├── favicon.ico       # Browser tab icon
│   │   ├── globals.css       # Global CSS styles (Tailwind base/utilities)
│   │   ├── layout.tsx        # Root layout component
│   │   └── page.tsx          # Main page component (renders the map)
│   ├── components/
│   │   ├── MapView.tsx       # Core MapLibre map component. Initializes the map, manages base style changes, and handles adding/removing overlay layers based on `activeLayerIds` prop. **Also includes logic to display popups with details when features in specific interactive layers (like California fire perimeters) are clicked.**
│   │   ├── MapWrapper.tsx    # Client component wrapper for dynamic map loading
│   │   ├── Toolbar.tsx       # Floating vertical toolbar with action buttons
│   │   ├── BasemapSwitcher.tsx # UI component for selecting different base map styles
│   │   ├── LayerSwitcher.tsx  # UI component for toggling the visibility of overlay layers
│   │   ├── Legend.tsx        # UI component for displaying legends of active overlay layers
│   │   ├── LoadingIndicator.tsx # A UI component that displays a centered loading spinner with a customizable message. Used to provide visual feedback when data-intensive layers (like California fire perimeters) are being loaded.
│   │   ├── FilterSlider.tsx   # A reusable slider component for filtering numeric values (used for fire size filtering)
│   │   ├── FireAnalysisSidebar.tsx # A comprehensive UI component for fire data analysis, including filtering, visualization, and statistics
│   │   └── ...               # Other components
│   ├── config/
│   │   ├── mapStyles.ts      # Defines available basemap styles
│   │   └── overlayLayers.ts  # Defines available overlay layers
│   ├── contexts/
│   │   └── FireDataContext.tsx # A React Context provider that centralizes fire data management. It fetches California fire perimeter data from the ArcGIS REST API, caches it client-side, provides filtering capabilities, and calculates statistics. **Includes an `ensureFireLayerOnTop` function to programmatically move fire-related layers to the top of the map's layer stack, ensuring visibility over other choropleth layers.** This context allows components to access and manipulate the same data without redundant API calls.
│   ├── utils/
│   │   ├── asthmaData.ts       # Utility functions for processing asthma prevalence data
│   │   └── ...                 # Other utility files
│   └── ...                   # Other source files
├── .eslintrc.json            # ESLint configuration
├── .gitignore                # Files/folders ignored by Git
├── next-env.d.ts             # Next.js TypeScript environment types
├── next.config.mjs           # Next.js configuration file
├── package.json              # Project metadata and dependencies
├── pnpm-lock.yaml            # Exact dependency versions
├── postcss.config.mjs        # PostCSS configuration (for Tailwind 4)
├── README.md                 # Project README
├── tailwind.config.ts        # Tailwind CSS configuration
└── tsconfig.json             # TypeScript configuration
```

## Key Files Explanation

*   **`src/app/page.tsx`**: The main entry point page for the application. Currently, it renders the `MapWrapper`.
*   **`src/app/layout.tsx`**: The root layout that wraps all pages. Defines the basic HTML structure and includes global styles.
*   **`src/components/MapWrapper.tsx`**: A client component (`'use client'`) responsible for dynamically importing `MapView` with SSR disabled (`next/dynamic`). This is necessary because MapLibre interacts with browser-specific APIs.
*   **`src/components/MapView.tsx`**: The core MapLibre map component. Initializes the map, manages base style changes, adds/removes overlay layers, handles popups, and applies filters.
*   **`next.config.mjs`**: Configuration for Next.js. Contains standard settings suitable for Vercel deployment.
*   **`src/components/Toolbar.tsx`**: A client component (`'use client'`) that displays a floating vertical toolbar on the left side of the screen with two buttons: one for basemap switching and one for layer toggling (US state boundaries).
*   **`src/components/BasemapSwitcher.tsx`**: A UI component, typically shown adjacent to the Toolbar, allowing users to select different base map styles.
*   **`src/components/LayerSwitcher.tsx`**: A UI component, typically shown adjacent to the Toolbar, allowing users to toggle the visibility of overlay layers.
*   **`src/components/Legend.tsx`**: A UI component, typically positioned at the bottom-right, that displays legends for currently active overlay layers. Supports both image-based legends (via `legendUrl`) and gradient-type legends with color swatches (via `legend` configuration).
*   **`src/components/FireAnalysisSidebar.tsx`**: A sophisticated sidebar component that provides comprehensive fire data analysis tools. Features include statistical summaries (total fires, acres, average size), interactive visualizations (bar charts for years, horizontal bars for causes), and multi-criteria filtering (by year, size, cause, agency). Opens when the user clicks the Analysis button in the toolbar.
*   **`src/contexts/FireDataContext.tsx`**: A React Context provider that centralizes fire data management. It fetches California fire perimeter data from the ArcGIS REST API, caches it client-side, provides filtering capabilities, and calculates statistics. **Includes an `ensureFireLayerOnTop` function to programmatically move fire-related layers to the top of the map's layer stack, ensuring visibility over other choropleth layers.** This context allows components to access and manipulate the same data without redundant API calls.
*   **`src/config/mapStyles.ts`**: Defines available basemap styles (name, ID, MapLibre style object/URL).
*   **`src/config/overlayLayers.ts`**: 
    **Description:** Defines the configuration for various map overlay layers that can be toggled by the user. Each layer object specifies its ID, display name, type (e.g., 'tile', 'wms', 'geojson', 'vector', 'raster'), source ID, source definition (URL or MapLibre SourceSpecification), MapLibre layer specification for styling, initial visibility, and optional legend info.

    **Key Contents:**
    *   Configuration objects for:
        *   US State Outlines (GeoJSON example)
        *   California County Boundaries (GeoJSON from local file, always visible)
        *   California Fire Perimeters (GeoJSON from ArcGIS REST API, 2018-2023)
    *   Includes NWS Weather Radar layers from the NOAA GeoServer WMS service:
        *   NWS Radar (Base Reflectivity) - Layer: `conus_bref_qcd`
        *   NWS Radar (Composite Reflectivity) - Layer: `conus_cref_qcd`
        *   NWS Radar (Echo Tops) - Layer: `conus_neet_v18`
        *   NWS Radar (Precipitation Type) - Layer: `conus_pcpn_typ`
    *   Layer options include MapLibre paint properties for styling (e.g., `'fill-color'` with interpolation for fire years). Popups are handled outside this config via map event listeners.
    *   Includes enhanced legend configuration for the fire perimeters layer with gradient color swatches.

    **Purpose in Application:** Provides the central configuration for all data layers displayed on the map, allowing easy management and toggling of different datasets within the MapLibre framework.
*   **`src/app/globals.css`**: Contains Tailwind CSS directives (`@tailwind base`, `@tailwind components`, `@tailwind utilities`).
*   **`tailwind.config.ts`**: Configuration file for Tailwind CSS.
*   **`postcss.config.mjs`**: Configures PostCSS, primarily used here to enable the Tailwind CSS v4 plugin (`@tailwindcss/postcss`).
*   **`package.json`**: Lists project dependencies and scripts (`dev`, `build`, `start`, `lint`). Note: Contains a `deploy` script and `gh-pages` dependency which were for GitHub Pages deployment and are no longer relevant for Vercel.
