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
│   │   ├── MapView.tsx       # Core MapLibre map component
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
*   **`src/components/MapView.tsx`**: Contains the core logic for initializing and managing the MapLibre map instance. It uses `useEffect` and `useRef` for map handling.
*   **`src/components/MapWrapper.tsx`**: A client component (`'use client'`) responsible for dynamically importing `MapView` with SSR disabled (`next/dynamic`). This is necessary because MapLibre interacts with browser-specific APIs.
*   **`src/components/Toolbar.tsx`**: A client component (`'use client'`) that displays a floating vertical toolbar on the left side of the screen, intended to hold action buttons for different functionalities.
*   **`src/components/BasemapSwitcher.tsx`**: A UI component, typically shown adjacent to the Toolbar, allowing users to select different base map styles.
*   **`src/components/LayerSwitcher.tsx`**: A UI component, typically shown adjacent to the Toolbar, allowing users to toggle the visibility of overlay layers.
*   **`src/components/Legend.tsx`**: A UI component, typically positioned at the bottom-right, that displays legends (usually images fetched via URL) for currently active overlay layers that have a `legendUrl` defined in their configuration.
*   **`src/config/mapStyles.ts`**: Defines available basemap styles (name, ID, MapLibre style object/URL).
*   **`src/config/overlayLayers.ts`**: Defines available overlay layers (name, ID, source details, layer styling, initial visibility, optional legend URL). Currently includes US State Outlines, NWS Radar (Base Refl., Comp. Refl., Echo Tops, Precip Type via WMS), and NDFD Temperature Forecasts (Max/Min Day 1-3 via WMS).
*   **`src/app/globals.css`**: Contains Tailwind CSS directives (`@tailwind base`, `@tailwind components`, `@tailwind utilities`).
*   **`tailwind.config.ts`**: Configuration file for Tailwind CSS.
*   **`postcss.config.mjs`**: Configures PostCSS, primarily used here to enable the Tailwind CSS v4 plugin (`@tailwindcss/postcss`).
*   **`next.config.mjs`**: Configuration options for the Next.js framework.
*   **`package.json`**: Lists project dependencies and scripts (`dev`, `build`, `start`, `lint`).
