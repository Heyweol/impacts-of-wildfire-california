'use client';

import React, { useState } from 'react';
import BasemapSwitcher from './BasemapSwitcher';
import LayerSwitcher from './LayerSwitcher';
import TemperatureYearSelector from './TemperatureYearSelector';
// Import icons from react-icons
import { FaGlobe, FaFire, FaChartBar, FaInfoCircle } from 'react-icons/fa';
import { MdLayers } from 'react-icons/md';
import { RiLungsFill } from 'react-icons/ri';
import { WiThermometer } from 'react-icons/wi';
// import { BsExclamationCircle } from 'react-icons/bs';

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

// Placeholder icon using react-icons
// const PlaceholderIcon = () => <BsExclamationCircle className="w-6 h-6" />; 
// Globe Icon
const GlobeIcon = () => <FaGlobe className="h-6 w-6" />;
// Layers Icon
const LayersIcon = () => <MdLayers className="h-6 w-6" />;
// Fire Icon
const FireIcon = () => <FaFire className="h-6 w-6" />;
// Chart/Analysis Icon
const ChartIcon = () => <FaChartBar className="h-6 w-6" />;
// Health/Lungs Icon for Asthma data
const LungsIcon = () => <RiLungsFill className="h-6 w-6" />;
// Temperature Icon for Temperature Anomaly data
const TemperatureIcon = () => <WiThermometer className="h-6 w-6" style={{ fontSize: '1.75rem' }} />;
// Info Icon
const InfoIcon = () => <FaInfoCircle className="h-6 w-6" />;

const Toolbar: React.FC<ToolbarProps> = ({ 
  activeStyleId, 
  onStyleChange,
  activeLayerIds, // Receive layer state
  onLayerToggle,  // Receive layer toggle handler
  onOpenAnalysis, // Receive analysis sidebar handler
  onTemperatureYearChange // Temperature year change handler
}) => {
  // State for visibility toggles
  const [isSwitcherVisible, setIsSwitcherVisible] = useState(false);
  const [isLayerSwitcherVisible, setIsLayerSwitcherVisible] = useState(false);
  const [isFireLayerActive, setIsFireLayerActive] = useState(false);
  const [isAsthmaLayerActive, setIsAsthmaLayerActive] = useState(false);
  const [isTemperatureLayerActive, setIsTemperatureLayerActive] = useState(false);
  const [isTemperatureYearSelectorVisible, setIsTemperatureYearSelectorVisible] = useState(false);
  const [selectedTemperatureYear, setSelectedTemperatureYear] = useState<number | null>(null);
  // Add info modal visibility state
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);

  // When toolbar is initially rendered, update the layer button active states
  // based on activeLayerIds
  React.useEffect(() => {
    setIsFireLayerActive(activeLayerIds.includes('california-fire-perimeters'));
    setIsAsthmaLayerActive(activeLayerIds.includes('california-asthma-prevalence'));
    setIsTemperatureLayerActive(activeLayerIds.includes('california-temperature-anomaly'));
  }, [activeLayerIds]);

  // Define the toolbar buttons
  const toolbarButtons = [
    { name: 'basemap', tooltip: 'Change basemap', Icon: GlobeIcon, active: isSwitcherVisible },
    { name: 'layers', tooltip: 'Layer manager', Icon: LayersIcon, active: isLayerSwitcherVisible },
    { name: 'fire', tooltip: 'Toggle wildfire perimeters', Icon: FireIcon, active: isFireLayerActive },
    { name: 'asthma', tooltip: 'Toggle asthma prevalence', Icon: LungsIcon, active: isAsthmaLayerActive },
    { name: 'temperature', tooltip: 'Toggle temperature anomaly', Icon: TemperatureIcon, active: isTemperatureLayerActive },
    { name: 'analysis', tooltip: 'Open analysis tools', Icon: ChartIcon, active: false }
  ];

  return (
    <div className="absolute top-1/2 left-4 -translate-y-1/2 z-10 flex flex-col space-y-2">
      <div className="flex flex-col space-y-2 bg-white bg-opacity-90 dark:bg-gray-700 dark:bg-opacity-90 p-1 rounded-lg shadow-lg">
        {toolbarButtons.map(({ name, tooltip, Icon, active }) => {
          // ID selectors for specific buttons
          const isBasemapButton = name === 'basemap';
          const isLayerButton = name === 'layers';
          const isFireButton = name === 'fire';
          const isAsthmaButton = name === 'asthma';
          const isTemperatureButton = name === 'temperature';
          const isAnalysisButton = name === 'analysis';
          
          return (
            <button 
              key={name} 
              title={tooltip}
              aria-label={tooltip}
              className={`p-2 rounded-md transition-all ${
                active 
                  ? 'bg-blue-500 text-white' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => {
                if (isBasemapButton) {
                  // Toggle the basemap switcher visibility
                  setIsSwitcherVisible(!isSwitcherVisible);
                  // Close other panels
                  setIsLayerSwitcherVisible(false);
                  setIsTemperatureYearSelectorVisible(false);
                } else if (isLayerButton) {
                  // Toggle the layer switcher visibility
                  setIsLayerSwitcherVisible(!isLayerSwitcherVisible);
                  // Close other panels
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
      
      {/* Info button at the bottom */}
      <div className="bg-white bg-opacity-90 dark:bg-gray-700 dark:bg-opacity-90 p-1 rounded-lg shadow-lg">
        <button
          title="Information"
          aria-label="Information"
          className={`p-2 rounded-md transition-all ${
            isInfoModalVisible 
              ? 'bg-blue-500 text-white' 
              : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => setIsInfoModalVisible(!isInfoModalVisible)}
        >
          <InfoIcon />
        </button>
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
      
      {/* Info Modal */}
      {isInfoModalVisible && (
        <div className="absolute top-1/2 -translate-y-1/2 left-full ml-2 z-50 w-80">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">About This Project</h2>
              <button 
                onClick={() => setIsInfoModalVisible(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <h3 className="font-semibold">Impacts of Wildfire in California</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                This interactive map website focuses on California wildfire distribution, it also allows users to interact with historical wildfire spatial and temporal data, explore the causes and impacts of wildfire.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold">Features</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300">
                  <li>Interactive wildfire perimeter visualization</li>
                  <li>Health impact assessment (asthma prevalence)</li>
                  <li>Temperature anomaly analysis</li>
                  <li>Spatial-temporal analytical tools</li>
                </ul>
              </div>
              
              
              <div>
                <h3 className="font-semibold">Research Group</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300">
                  <li>Yuan Gao - <a href="mailto:gao342@wisc.edu" className="text-blue-500 hover:underline">gao342@wisc.edu</a></li>
                  <li>Yulong Jiao - <a href="mailto:yjiao37@wisc.edu" className="text-blue-500 hover:underline">yjiao37@wisc.edu</a></li>
                  <li>Haiyue Liu - <a href="mailto:haiyueliu1122@gmail.com" className="text-blue-500 hover:underline">haiyueliu1122@gmail.com</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold">Links</h3>
                <div className="flex flex-col space-y-2 mt-2">
                  <a href="https://github.com/Heyweol/impacts-of-wildfire-california" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                    GitHub Repository
                  </a>
                  {/* <a href="https://cal-fire.gov" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                    CAL FIRE
                  </a>
                  <a href="https://www.cdph.ca.gov" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                    CDPH
                  </a> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbar;
