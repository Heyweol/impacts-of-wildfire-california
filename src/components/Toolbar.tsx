'use client';

import React, { useState } from 'react';
import BasemapSwitcher from './BasemapSwitcher';

// Define props for the Toolbar
interface ToolbarProps {
  activeStyleId: string;
  onStyleChange: (styleId: string) => void;
}

// Placeholder icons (replace with actual icons later)
const PlaceholderIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; 
// Simple Layers Icon
const LayersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;

const Toolbar: React.FC<ToolbarProps> = ({ activeStyleId, onStyleChange }) => {
  const [isSwitcherVisible, setIsSwitcherVisible] = useState(false);
  const buttons = Array(6).fill(null); // Create 6 placeholder buttons


  return (
    <div className="absolute top-1/2 left-4 -translate-y-1/2 z-10">
      <div className="relative p-2 bg-white dark:bg-zinc-800 shadow-lg rounded-md flex flex-col space-y-2">
        {buttons.map((_, index) => {
          const isBasemapButton = index === 0;
          const Icon = isBasemapButton ? LayersIcon : PlaceholderIcon;
          const label = isBasemapButton ? "Basemaps" : `Tool ${index + 1}`;

          return (
            <button
              key={index}
              className={`p-2 rounded ${isSwitcherVisible && isBasemapButton ? 'bg-blue-100 dark:bg-blue-900' : ''} hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              aria-label={label}
              title={label}
              onClick={() => {
                if (isBasemapButton) {
                  setIsSwitcherVisible(!isSwitcherVisible);
                }
                // Add onClick handlers for other buttons later
              }}
            >
              <Icon />
            </button>
          );
        })}
      </div>
      {/* Conditionally render the switcher outside the button container but aligned */} 
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
    </div>
  );
};

export default Toolbar;
