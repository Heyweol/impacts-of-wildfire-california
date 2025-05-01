'use client';

import React from 'react';

interface LoadingIndicatorProps {
  isLoading: boolean;
  message?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  isLoading, 
  message = 'Loading data...' 
}) => {
  if (!isLoading) return null;

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
      <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg flex flex-col items-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="text-sm text-gray-700">{message}</p>
      </div>
    </div>
  );
};

export default LoadingIndicator;
