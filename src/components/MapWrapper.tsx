'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Define props for the wrapper
interface MapWrapperProps {
  activeStyleId: string;
  activeLayerIds: string[];
  minIncidentSize: number;
  onDataRangeLoad: (min: number, max: number) => void;
}

// Dynamically import MapView with SSR disabled
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <p className="text-center mt-10">Loading map...</p>, // Optional loading state
});

const MapWrapper: React.FC<MapWrapperProps> = ({ activeStyleId, activeLayerIds, minIncidentSize, onDataRangeLoad }) => {
  // Pass the activeStyleId and activeLayerIds down to the actual MapView component
  return (
    <div className="w-full h-full">
      <MapView 
        activeStyleId={activeStyleId} 
        activeLayerIds={activeLayerIds} 
        minIncidentSize={minIncidentSize} 
        onDataRangeLoad={onDataRangeLoad} 
      />
    </div>
  );
};

export default MapWrapper;
