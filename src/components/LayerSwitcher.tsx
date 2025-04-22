'use client';

import React from 'react';
import { overlayLayers, OverlayLayerConfig } from '@/config/overlayLayers';

interface LayerSwitcherProps {
  activeLayerIds: string[];
  onLayerToggle: (layerId: string) => void;
  onClose?: () => void; // Optional close handler
}

const LayerSwitcher: React.FC<LayerSwitcherProps> = ({ 
  activeLayerIds,
  onLayerToggle,
  onClose 
}) => {
  return (
    <div className="absolute top-0 left-full ml-2 z-20 p-3 bg-white dark:bg-zinc-800 shadow-lg rounded-md flex flex-col space-y-2 max-w-xs w-48">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Layers</h3>
        {onClose && (
            <button 
              onClick={onClose}
              className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              aria-label="Close layer switcher"
            >
              {/* Simple X icon */} 
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
        )}
      </div>

      {overlayLayers.map((layer: OverlayLayerConfig) => (
        // Don't render placeholders for now, or handle them differently later
        layer.type !== 'placeholder' && (
          <div key={layer.id} className="flex items-center justify-between">
            <label 
              htmlFor={`layer-toggle-${layer.id}`} 
              className="text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer select-none flex-grow mr-2 truncate"
              title={layer.name}
            >
              {layer.name}
            </label>
            <input
              type="checkbox"
              id={`layer-toggle-${layer.id}`}
              checked={activeLayerIds.includes(layer.id)}
              onChange={() => onLayerToggle(layer.id)}
              className="form-checkbox h-4 w-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500 dark:bg-zinc-700 dark:border-zinc-600 dark:checked:bg-blue-500 dark:focus:ring-offset-zinc-800 cursor-pointer"
            />
          </div>
        )
      ))}

      {overlayLayers.filter(l => l.type === 'placeholder').length > 0 && (
        <div className="pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-700">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">More layers coming soon.</p>
        </div>
      )}
    </div>
  );
};

export default LayerSwitcher;
