'use client';

import React, { useState } from 'react';
import BasemapSwitcher from './BasemapSwitcher';
import LayerSwitcher from './LayerSwitcher';

// Define props for the Toolbar
interface ToolbarProps {
  activeStyleId: string;
  onStyleChange: (styleId: string) => void;
  // Add props for layer management
  activeLayerIds: string[];
  onLayerToggle: (layerId: string) => void;
}

// Placeholder icons (replace with actual icons later)
const PlaceholderIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; 
// Globe Icon
const GlobeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h8a2 2 0 002-2v-1a2 2 0 012-2h1.945M12 4.5v6.989l-2.256 1.008M12 4.5a9 9 0 11-7.929 11.515M12 4.5v6.989l2.256 1.008m4.83 4.491l.949 1.5M4.22 20.515l.949-1.5M12 21.75c-2.676 0-5.216-.584-7.499-1.632" /></svg>;
// Layers Icon
const LayersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
// Simple Fire Icon Placeholder - Removed

const Toolbar: React.FC<ToolbarProps> = ({ 
  activeStyleId, 
  onStyleChange,
  activeLayerIds, // Receive layer state
  onLayerToggle   // Receive layer toggle handler
}) => {
  const [isSwitcherVisible, setIsSwitcherVisible] = useState(false);
  const [isLayerSwitcherVisible, setIsLayerSwitcherVisible] = useState(false); // State for LayerSwitcher
  const buttons = Array(2).fill(null); // Create 2 buttons only

  return (
    <div className="absolute top-1/2 left-4 -translate-y-1/2 z-10">
      <div className="relative p-2 bg-white dark:bg-zinc-800 shadow-lg rounded-md flex flex-col space-y-2">
        {buttons.map((_, index) => {
          const isBasemapButton = index === 0;
          const isLayersButton = index === 1;
          // Assign Icons based on index
          let Icon = PlaceholderIcon;
          let label = `Tool ${index + 1}`;
          let isActive = false;

          if (isBasemapButton) {
              Icon = GlobeIcon;
              label = "Basemaps";
              isActive = isSwitcherVisible;
          } else if (isLayersButton) {
              Icon = LayersIcon;
              label = "Layers";
              isActive = isLayerSwitcherVisible;
          }

          // Conditional styling for active state
          const activeClasses = isActive ? 'bg-blue-100 dark:bg-blue-900' : '';

          return (
            <button
              key={index}
              className={`p-2 rounded ${activeClasses} hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              aria-label={label}
              title={label}
              onClick={() => {
                if (isBasemapButton) {
                  setIsSwitcherVisible(!isSwitcherVisible);
                  setIsLayerSwitcherVisible(false);
                } else if (isLayersButton) {
                  setIsLayerSwitcherVisible(!isLayerSwitcherVisible);
                  setIsSwitcherVisible(false);
                }
                // Add onClick handlers for other buttons later
              }}
            >
              <Icon />
            </button>
          );
        })}
      </div>
      {/* Conditionally render the Basemap switcher */} 
      {isSwitcherVisible && (
          <BasemapSwitcher 
            activeStyleId={activeStyleId} 
            onStyleChange={(styleId) => {
              onStyleChange(styleId); 
              // Optional: close switcher on selection
              // setIsSwitcherVisible(false); 
            }}
            onClose={() => setIsSwitcherVisible(false)}
          />
      )}
      {/* Conditionally render the Layer switcher */} 
      {isLayerSwitcherVisible && (
        <LayerSwitcher
          activeLayerIds={activeLayerIds} // Pass state down
          onLayerToggle={onLayerToggle} // Pass handler down
          onClose={() => setIsLayerSwitcherVisible(false)}
        />
      )}
    </div>
  );
};

export default Toolbar;
