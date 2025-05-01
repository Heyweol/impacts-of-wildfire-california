'use client';

import dynamic from 'next/dynamic';
import React, { useEffect } from 'react';

// Define props for the wrapper
interface MapWrapperProps {
  activeStyleId: string;
  activeLayerIds: string[];
  minIncidentSize: number;
  onDataRangeLoad: (min: number, max: number) => void;
  // Add selectedTemperatureYear prop to receive from parent
  selectedTemperatureYear?: number | null;
}

// Dynamically import MapView with SSR disabled
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <p className="text-center mt-10">Loading map...</p>, // Optional loading state
});

const MapWrapper: React.FC<MapWrapperProps> = ({ 
  activeStyleId, 
  activeLayerIds, 
  minIncidentSize, 
  onDataRangeLoad, 
  // Receive selectedTemperatureYear from parent
  selectedTemperatureYear: parentSelectedYear 
}) => {
  // Use the parent's selected year directly instead of maintaining separate state
  
  // Log when the selected year changes from parent
  useEffect(() => {
    if (parentSelectedYear !== undefined) {
      console.log(`MapWrapper received temperature year: ${parentSelectedYear === null ? 'average' : `20${parentSelectedYear}`}`);
    }
  }, [parentSelectedYear]);
  
  // Pass the activeStyleId and activeLayerIds down to the actual MapView component
  return (
    <div className="w-full h-full">
      <MapView 
        activeStyleId={activeStyleId} 
        activeLayerIds={activeLayerIds} 
        minIncidentSize={minIncidentSize} 
        onDataRangeLoad={onDataRangeLoad}
        selectedTemperatureYear={parentSelectedYear}
      />
    </div>
  );
};

export default MapWrapper;
