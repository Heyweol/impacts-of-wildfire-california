import React from 'react';
import { OverlayLayerConfig } from '@/config/overlayLayers';

interface LegendProps {
  layers: OverlayLayerConfig[];
  activeLayerIds: string[];
}

const Legend: React.FC<LegendProps> = ({ layers, activeLayerIds }) => {
  const activeLegends = layers.filter(
    (layer) => activeLayerIds.includes(layer.id) && layer.legendUrl
  );

  if (activeLegends.length === 0) {
    return null; // Don't render anything if no active layers have legends
  }

  return (
    // Adjusted padding, background opacity
    <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg max-w-xs">
      {/* Adjusted header size, weight, margin, text color */}
      <h4 className="text-base font-medium mb-2 border-b border-gray-300 pb-1 text-gray-900">Legend</h4>
      <div className="flex flex-col space-y-3"> {/* Increased spacing */}
        {activeLegends.map((layer) => (
          <div key={layer.id}>
            {/* Adjusted layer name size, weight, margin, text color */}
            <p className="text-sm font-medium mb-1 text-gray-800">{layer.name}</p>
            <img
              src={layer.legendUrl}
              alt={`${layer.name} Legend`}
              className="max-w-full h-auto border border-gray-200 rounded-sm" // Added subtle border
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Legend;
