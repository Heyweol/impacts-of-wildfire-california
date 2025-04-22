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

## Next Steps

*   Implement header/navigation.
*   Add sidebar for controls/layers.
*   Integrate wildfire data sources.
*   Refine map styling and base layers (potentially using an API key for better styles).
