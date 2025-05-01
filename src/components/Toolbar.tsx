'use client';

import React, { useState } from 'react';
import BasemapSwitcher from './BasemapSwitcher';
import LayerSwitcher from './LayerSwitcher';
import TemperatureYearSelector from './TemperatureYearSelector';

// Define props for the Toolbar
interface ToolbarProps {
  activeStyleId: string;
  onStyleChange: (styleId: string) => void;
  // Add props for layer management
  activeLayerIds: string[];
  onLayerToggle: (layerId: string) => void;
  // Add props for analysis sidebar
  onOpenAnalysis: () => void;
  // Add props for temperature year selection
  onTemperatureYearChange?: (year: number | null) => void;
}

// Placeholder icons (replace with actual icons later)
const PlaceholderIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; 
// Globe Icon
const GlobeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h8a2 2 0 002-2v-1a2 2 0 012-2h1.945M12 4.5v6.989l-2.256 1.008M12 4.5a9 9 0 11-7.929 11.515M12 4.5v6.989l2.256 1.008m4.83 4.491l.949 1.5M4.22 20.515l.949-1.5M12 21.75c-2.676 0-5.216-.584-7.499-1.632" /></svg>;
// Layers Icon
const LayersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
// Fire Icon
const FireIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11.1c.248.6.4 1.2.4 1.9a2.986 2.986 0 01-1.425 2.56" /></svg>;

// Chart/Analysis Icon
const ChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;

// Health/Lungs Icon for Asthma data
const LungsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v7.5M9 12.75V19.5m0-6.75l-3-3m3 3l3-3m-6 3V4.5m6 9v-6.75" /></svg>;

// Temperature Icon for Temperature Anomaly data
const TemperatureIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 004.5 9.375v6.75A1.125 1.125 0 005.625 17.25h1.5a3.375 3.375 0 003.375-3.375V14.25m0 0v-3.375a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 004.5 9.375v6.75A1.125 1.125 0 005.625 17.25h1.5a3.375 3.375 0 003.375-3.375v-3" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" /></svg>;

const Toolbar: React.FC<ToolbarProps> = ({ 
  activeStyleId, 
  onStyleChange,
  activeLayerIds, // Receive layer state
  onLayerToggle,  // Receive layer toggle handler
  onOpenAnalysis, // Receive analysis sidebar handler
  onTemperatureYearChange // Temperature year change handler
}) => {
  const [isSwitcherVisible, setIsSwitcherVisible] = useState(false);
  const [isLayerSwitcherVisible, setIsLayerSwitcherVisible] = useState(false); // State for LayerSwitcher
  const [isFireLayerActive, setIsFireLayerActive] = useState(false); // State for Fire layer
  const [isAsthmaLayerActive, setIsAsthmaLayerActive] = useState(false); // State for Asthma layer
  const [isTemperatureLayerActive, setIsTemperatureLayerActive] = useState(false); // State for Temperature layer
  const [isTemperatureYearSelectorVisible, setIsTemperatureYearSelectorVisible] = useState(false); // State for Temperature year selector
  const [selectedTemperatureYear, setSelectedTemperatureYear] = useState<number | null>(null); // null means average
  const buttons = Array(6).fill(null); // Create 6 buttons now (added temperature button)

  return (
    <div className="absolute top-1/2 left-4 -translate-y-1/2 z-10">
      <div className="relative p-2 bg-white dark:bg-zinc-800 shadow-lg rounded-md flex flex-col space-y-2">
        {buttons.map((_, index) => {
          const isBasemapButton = index === 0;
          const isLayersButton = index === 1;
          const isFireButton = index === 2;
          const isAsthmaButton = index === 3;
          const isTemperatureButton = index === 4;
          const isAnalysisButton = index === 5;
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
          } else if (isFireButton) {
              Icon = FireIcon;
              label = "Fire!";
              isActive = isFireLayerActive;
          } else if (isAsthmaButton) {
              Icon = LungsIcon;
              label = "Asthma Data";
              isActive = isAsthmaLayerActive;
          } else if (isTemperatureButton) {
              Icon = TemperatureIcon;
              label = "Temperature";
              isActive = isTemperatureLayerActive || isTemperatureYearSelectorVisible;
          } else if (isAnalysisButton) {
              Icon = ChartIcon;
              label = "Analysis";
              isActive = false;
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
                  setIsTemperatureYearSelectorVisible(false);
                } else if (isLayersButton) {
                  setIsLayerSwitcherVisible(!isLayerSwitcherVisible);
                  setIsSwitcherVisible(false);
                  setIsTemperatureYearSelectorVisible(false);
                } else if (isFireButton) {
                  // Toggle the fire layer
                  const newState = !isFireLayerActive;
                  setIsFireLayerActive(newState);
                  // If the fire layer is not already in activeLayerIds, add it
                  if (newState && !activeLayerIds.includes('california-fire-perimeters')) {
                    onLayerToggle('california-fire-perimeters');
                  } 
                  // If the fire layer is in activeLayerIds and we're turning it off, remove it
                  else if (!newState && activeLayerIds.includes('california-fire-perimeters')) {
                    onLayerToggle('california-fire-perimeters');
                  }
                } else if (isAsthmaButton) {
                  // Toggle the asthma layer
                  const newState = !isAsthmaLayerActive;
                  setIsAsthmaLayerActive(newState);
                  // If the asthma layer is not already in activeLayerIds, add it
                  if (newState && !activeLayerIds.includes('california-asthma-prevalence')) {
                    onLayerToggle('california-asthma-prevalence');
                  } 
                  // If the asthma layer is in activeLayerIds and we're turning it off, remove it
                  else if (!newState && activeLayerIds.includes('california-asthma-prevalence')) {
                    onLayerToggle('california-asthma-prevalence');
                  }
                } else if (isTemperatureButton) {
                  // Toggle the temperature layer
                  const newState = !isTemperatureLayerActive;
                  setIsTemperatureLayerActive(newState);
                  
                  if (newState) {
                    // If turning on, show year selector and add the layer
                    setIsTemperatureYearSelectorVisible(true);
                    if (!activeLayerIds.includes('california-temperature-anomaly')) {
                      onLayerToggle('california-temperature-anomaly');
                    }
                  } else {
                    // If turning off, hide year selector and remove the layer
                    setIsTemperatureYearSelectorVisible(false);
                    if (activeLayerIds.includes('california-temperature-anomaly')) {
                      onLayerToggle('california-temperature-anomaly');
                    }
                  }
                } else if (isAnalysisButton) {
                  // Close other panels
                  setIsSwitcherVisible(false);
                  setIsLayerSwitcherVisible(false);
                  setIsTemperatureYearSelectorVisible(false);
                  // Open analysis sidebar
                  onOpenAnalysis();
                }
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
      {/* Conditionally render the Temperature Year selector */}
      {isTemperatureYearSelectorVisible && (
        <div className="relative">
          <TemperatureYearSelector
            selectedYear={selectedTemperatureYear}
            onYearChange={(year) => {
              setSelectedTemperatureYear(year);
              // Call the parent handler to update the map
              if (onTemperatureYearChange) {
                onTemperatureYearChange(year);
              }
            }}
            onClose={() => setIsTemperatureYearSelectorVisible(false)}
          />
        </div>
      )}
    </div>
  );
};

export default Toolbar;
