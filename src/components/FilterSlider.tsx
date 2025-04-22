'use client';

import React from 'react';

interface FilterSliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  label: string;
  unit: string;
  disabled?: boolean;
}

const FilterSlider: React.FC<FilterSliderProps> = ({
  min,
  max,
  step,
  value,
  onChange,
  label,
  unit,
  disabled = false,
}) => {
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value));
  };

  return (
    <div className={`p-4 bg-white dark:bg-zinc-800 shadow-md rounded-lg ${disabled ? 'opacity-50' : ''}`}>
      <label htmlFor="filter-slider" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}: {value.toLocaleString()} {unit}
      </label>
      <input
        id="filter-slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleSliderChange}
        disabled={disabled}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600 disabled:cursor-not-allowed"
      />
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
        <span>{min.toLocaleString()}</span>
        <span>{max.toLocaleString()} {unit}</span>
      </div>
    </div>
  );
};

export default FilterSlider;
