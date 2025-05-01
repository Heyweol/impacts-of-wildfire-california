import React from 'react';
import Image from 'next/image';
import { OverlayLayerConfig, LegendItem } from '@/config/overlayLayers';

interface LegendProps {
  layers: OverlayLayerConfig[];
  activeLayerIds: string[];
}

const Legend: React.FC<LegendProps> = ({ layers, activeLayerIds }) => {
  const activeLegends = layers.filter(
    (layer) => activeLayerIds.includes(layer.id) && (layer.legendUrl || layer.legend)
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
            {layer.legendUrl && (
              <Image
                src={layer.legendUrl}
                alt={`${layer.name} Legend`}
                width={200}
                height={100}
                className="max-w-full h-auto border border-gray-200 rounded-sm" // Added subtle border
              />
            )}
            {layer.legend?.type === 'gradient' && layer.legend.items && (
              <div className="mt-1">
                {layer.legend.title && (
                  <p className="text-xs font-medium text-gray-700 mb-1">{layer.legend.title}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {layer.legend.items.map((item: LegendItem, index: number) => (
                    <div key={index} className="flex items-center">
                      <div 
                        className="w-4 h-4 mr-1 rounded-sm" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-gray-700">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!layer.legendUrl && !layer.legend && (
              <p className="text-xs text-gray-500">No legend available.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Legend;
