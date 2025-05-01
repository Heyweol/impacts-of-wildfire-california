'use client';

import React from 'react';
import { getAvailableTemperatureYears } from '@/utils/temperatureData';

interface TemperatureYearSelectorProps {
  selectedYear: number | null;
  onYearChange: (year: number | null) => void;
  onClose?: () => void;
}

const TemperatureYearSelector: React.FC<TemperatureYearSelectorProps> = ({
  selectedYear,
  onYearChange,
  onClose
}) => {
  const years = getAvailableTemperatureYears();

  return (
    <div className="absolute top-full left-0 mt-2 z-20 p-3 bg-white dark:bg-zinc-800 shadow-lg rounded-md flex flex-col space-y-2 max-w-xs w-48">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Temperature Year</h3>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            aria-label="Close year selector"
          >
            {/* Simple X icon */} 
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex flex-col space-y-1">
        {years.map((year) => (
          <button
            key={year.value === null ? 'avg' : year.value}
            className={`text-left px-2 py-1 rounded text-sm ${
              selectedYear === year.value 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
            }`}
            onClick={() => onYearChange(year.value)}
          >
            {year.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TemperatureYearSelector;
