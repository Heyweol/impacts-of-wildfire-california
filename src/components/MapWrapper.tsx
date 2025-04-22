'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Define props for the wrapper
interface MapWrapperProps {
  activeStyleId: string;
}

// Dynamically import MapView with SSR disabled
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <p className="text-center mt-10">Loading map...</p>, // Optional loading state
});

const MapWrapper: React.FC<MapWrapperProps> = ({ activeStyleId }) => {
  // Pass the activeStyleId down to the actual MapView component
  return <MapView activeStyleId={activeStyleId} />;
};

export default MapWrapper;
