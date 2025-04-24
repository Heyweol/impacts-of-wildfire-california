'use client';

import React from 'react';
import { mapStyles } from '@/config/mapStyles';

interface BasemapSwitcherProps {
  activeStyleId: string;
  onStyleChange: (styleId: string) => void;
  onClose: () => void; // Function to close the switcher
}

const BasemapSwitcher: React.FC<BasemapSwitcherProps> = ({ activeStyleId, onStyleChange, onClose }) => {
  return (
    <div className="absolute top-0 left-full ml-2 z-20 p-2 bg-white dark:bg-zinc-800 shadow-lg rounded-md flex flex-col space-y-1 w-32">
       <div className="flex justify-between items-center mb-1 border-b pb-1 border-zinc-200 dark:border-zinc-700">
         <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Basemaps</h4>
         <button 
           onClick={onClose}
           className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
           aria-label="Close basemap switcher"
         >
            &times; {/* Simple close icon */}
         </button>
       </div>
      {mapStyles.map((style) => (
        <button
          key={style.id}
          className={`p-1.5 text-sm rounded w-full text-left ${ 
            activeStyleId === style.id 
            ? 'bg-blue-500 text-white' 
            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
          }`}
          onClick={() => {
            onStyleChange(style.id);
            // Optionally close switcher on selection
            // onClose(); 
          }}
        >
          {style.name}
        </button>
      ))}
    </div>
  );
};

export default BasemapSwitcher;
