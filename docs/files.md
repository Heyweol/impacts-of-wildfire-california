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
│   └── ...                   # Static assets go here
├── src/
│   ├── app/
│   │   ├── favicon.ico       # Browser tab icon
│   │   ├── globals.css       # Global CSS styles (Tailwind base/utilities)
│   │   ├── layout.tsx        # Root layout component
│   │   └── page.tsx          # Main page component (renders the map)
│   ├── components/
│   │   ├── MapView.tsx       # Core MapLibre map component. Initializes the map, manages base style changes, and handles adding/removing overlay layers based on `activeLayerIds` prop. **Also includes logic to display popups with details when features in specific interactive layers (like WFIGS fire events) are clicked.**
│   │   ├── MapWrapper.tsx    # Client component wrapper for dynamic map loading
│   │   ├── Toolbar.tsx       # Floating vertical toolbar with action buttons
│   │   ├── BasemapSwitcher.tsx # UI component for selecting different base map styles
│   │   ├── LayerSwitcher.tsx  # UI component for toggling the visibility of overlay layers
│   │   └── Legend.tsx        # UI component for displaying legends of active overlay layers
│   ├── config/
│   │   ├── mapStyles.ts      # Defines available basemap styles
│   │   └── overlayLayers.ts  # Defines available overlay layers
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
*   **`src/components/Toolbar.tsx`**: A client component (`'use client'`) that displays a floating vertical toolbar on the left side of the screen, intended to hold action buttons for different functionalities.
*   **`src/components/BasemapSwitcher.tsx`**: A UI component, typically shown adjacent to the Toolbar, allowing users to select different base map styles.
*   **`src/components/LayerSwitcher.tsx`**: A UI component, typically shown adjacent to the Toolbar, allowing users to toggle the visibility of overlay layers.
*   **`src/components/Legend.tsx`**: A UI component, typically positioned at the bottom-right, that displays legends (usually images fetched via URL) for currently active overlay layers that have a `legendUrl` defined in their configuration.
*   **`src/config/mapStyles.ts`**: Defines available basemap styles (name, ID, MapLibre style object/URL).
*   **`src/config/overlayLayers.ts`**: 
    **Description:** Defines the configuration for various map overlay layers that can be toggled by the user. Each layer object specifies its ID, display name, type (e.g., 'tile', 'wms', 'geojson', 'vector', 'raster'), source ID, source definition (URL or MapLibre SourceSpecification), MapLibre layer specification for styling, initial visibility, and optional legend info.

    **Key Contents:**
    *   Configuration objects for:
        *   OpenStreetMap base layer (Placeholder/Not implemented via this config currently)
        *   Satellite imagery (Placeholder/Not implemented via this config currently)
        *   Active Fire Perimeters (Placeholder)
        *   US State Outlines (GeoJSON example)
        *   NWS Radar Layers (WMS examples)
        *   NDFD Temperature Forecasts (WMS examples)
        *   US Fire Events (WFIGS - GeoJSON from ArcGIS Feature Service: `https://.../FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson`)
        *   ~~Past Incidents (USGS GeoJSON - Commented out due to CORS issues with direct client-side fetching)~~~
    *   Layer options include MapLibre paint properties for styling (e.g., `'circle-radius'`, `'circle-color'`). Popups are generally handled outside this config via map event listeners.

    **Purpose in Application:** Provides the central configuration for all data layers displayed on the map, allowing easy management and toggling of different datasets within the MapLibre framework.
*   **`src/app/globals.css`**: Contains Tailwind CSS directives (`@tailwind base`, `@tailwind components`, `@tailwind utilities`).
*   **`tailwind.config.ts`**: Configuration file for Tailwind CSS.
*   **`postcss.config.mjs`**: Configures PostCSS, primarily used here to enable the Tailwind CSS v4 plugin (`@tailwindcss/postcss`).
*   **`package.json`**: Lists project dependencies and scripts (`dev`, `build`, `start`, `lint`). Note: Contains a `deploy` script and `gh-pages` dependency which were for GitHub Pages deployment and are no longer relevant for Vercel.
