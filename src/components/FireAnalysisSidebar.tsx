'use client';

import React, { useState } from 'react';
import { useFireData, causeCodes } from '@/contexts/FireDataContext';

interface FireAnalysisSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const FireAnalysisSidebar: React.FC<FireAnalysisSidebarProps> = ({ isOpen, onClose }) => {
  const {
    isLoading,
    error,
    totalFires,
    totalAcres,
    yearCounts,
    causeCounts,
    agencyCounts,
    availableYears,
    availableCauses,
    availableAgencies,
    minPossibleAcres,
    maxPossibleAcres,
    filters,
    setFilters,
    resetFilters,
  } = useFireData();

  // Local state for filter inputs before applying
  const [yearSelections, setYearSelections] = useState<Record<number, boolean>>(() => {
    const selections: Record<number, boolean> = {};
    availableYears.forEach(year => {
      selections[year] = filters.years.includes(year);
    });
    return selections;
  });
  
  const [minAcres, setMinAcres] = useState<number>(filters.minAcres);
  const [maxAcres, setMaxAcres] = useState<number | null>(filters.maxAcres);
  
  const [causeSelections, setCauseSelections] = useState<Record<number, boolean>>(() => {
    const selections: Record<number, boolean> = {};
    availableCauses.forEach(cause => {
      selections[cause] = filters.causes ? filters.causes.includes(cause) : true;
    });
    return selections;
  });
  
  const [agencySelections, setAgencySelections] = useState<Record<string, boolean>>(() => {
    const selections: Record<string, boolean> = {};
    availableAgencies.forEach(agency => {
      selections[agency] = filters.agencies ? filters.agencies.includes(agency) : true;
    });
    return selections;
  });

  // Update local state when filters change
  React.useEffect(() => {
    const yearSelections: Record<number, boolean> = {};
    availableYears.forEach(year => {
      yearSelections[year] = filters.years.includes(year);
    });
    setYearSelections(yearSelections);
    
    setMinAcres(filters.minAcres);
    setMaxAcres(filters.maxAcres);
    
    const causeSelections: Record<number, boolean> = {};
    availableCauses.forEach(cause => {
      causeSelections[cause] = filters.causes ? filters.causes.includes(cause) : true;
    });
    setCauseSelections(causeSelections);
    
    const agencySelections: Record<string, boolean> = {};
    availableAgencies.forEach(agency => {
      agencySelections[agency] = filters.agencies ? filters.agencies.includes(agency) : true;
    });
    setAgencySelections(agencySelections);
  }, [filters, availableYears, availableCauses, availableAgencies]);

  // Apply filters
  const applyFilters = () => {
    const selectedYears = Object.entries(yearSelections)
      .filter(([_, selected]) => selected)
      .map(([year]) => parseInt(year));
    
    const selectedCauses = Object.entries(causeSelections)
      .filter(([_, selected]) => selected)
      .map(([cause]) => parseInt(cause));
    
    const selectedAgencies = Object.entries(agencySelections)
      .filter(([_, selected]) => selected)
      .map(([agency]) => agency);
    
    setFilters({
      years: selectedYears,
      minAcres,
      maxAcres,
      causes: selectedCauses.length === availableCauses.length ? null : selectedCauses,
      agencies: selectedAgencies.length === availableAgencies.length ? null : selectedAgencies,
    });
  };

  // Reset all filters
  const handleResetFilters = () => {
    resetFilters();
  };

  // Toggle all years
  const toggleAllYears = (selected: boolean) => {
    const newSelections = { ...yearSelections };
    availableYears.forEach(year => {
      newSelections[year] = selected;
    });
    setYearSelections(newSelections);
  };

  // Toggle all causes
  const toggleAllCauses = (selected: boolean) => {
    const newSelections = { ...causeSelections };
    availableCauses.forEach(cause => {
      newSelections[cause] = selected;
    });
    setCauseSelections(newSelections);
  };

  // Toggle all agencies
  const toggleAllAgencies = (selected: boolean) => {
    const newSelections = { ...agencySelections };
    availableAgencies.forEach(agency => {
      newSelections[agency] = selected;
    });
    setAgencySelections(newSelections);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-zinc-800 shadow-lg z-20 overflow-y-auto">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Fire Data Analysis</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700"
            aria-label="Close sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-md text-red-700 dark:text-red-400">
            <p>Error loading fire data: {error}</p>
          </div>
        ) : (
          <>
            {/* Summary Statistics */}
            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
              <h3 className="text-lg font-medium mb-2">Summary</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Fires</p>
                  <p className="text-xl font-bold">{totalFires.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Acres</p>
                  <p className="text-xl font-bold">{Math.round(totalAcres).toLocaleString()}</p>
                </div>
              </div>
              
              {/* Bar chart for fire count by year */}
              {Object.keys(yearCounts).length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <h4 className="text-sm font-medium mb-2">Fires by Year</h4>
                  <div className="grid grid-cols-6 gap-1">
                    {availableYears.map(year => {
                      const count = yearCounts[year] || 0;
                      const maxCount = Math.max(...Object.values(yearCounts), 1);
                      const percent = Math.round((count / maxCount) * 100);
                      
                      // Determine bar color based on year selection
                      const isSelected = filters.years.includes(year);
                      const barColor = isSelected 
                        ? 'bg-blue-500 dark:bg-blue-600' 
                        : 'bg-gray-300 dark:bg-gray-600';
                      
                      // Calculate height in pixels instead of percentage
                      const barHeight = Math.max(5, Math.round((count / maxCount) * 80));
                      
                      return (
                        <div key={year} className="flex flex-col items-center">
                          {/* Count display */}
                          <div className="text-xs font-medium mb-1">
                            {count}
                          </div>
                          
                          {/* Bar container - fixed height */}
                          <div className="h-20 w-full flex items-end justify-center">
                            <div 
                              className={`w-full ${barColor} rounded-t transition-all`}
                              style={{ height: `${barHeight}px` }}
                              title={`${year}: ${count} fires (${percent}% of max)`}
                            />
                          </div>
                          
                          {/* Year label */}
                          <div className="text-xs mt-1">{year}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Simple pie/bar for causes */}
              {Object.keys(causeCounts).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-1">Top Fire Causes</h4>
                  <div className="space-y-1">
                    {Object.entries(causeCounts)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([causeId, count]) => {
                        const cause = parseInt(causeId);
                        const maxCount = Math.max(...Object.values(causeCounts));
                        const width = maxCount > 0 ? (count / maxCount * 100) : 0;
                        const isSelected = !filters.causes || filters.causes.includes(cause);
                        
                        return (
                          <div key={causeId} className="flex flex-col">
                            <div className="flex justify-between text-xs mb-1">
                              <span>{causeCodes[cause] || `Unknown (${cause})`}</span>
                              <span>{count}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className={isSelected ? 'bg-green-500 h-2 rounded-full' : 'bg-gray-400 h-2 rounded-full'}
                                style={{ width: `${width}%` }} 
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Filters</h3>
                <div className="flex space-x-2">
                  <button 
                    onClick={applyFilters}
                    className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded"
                  >
                    Apply
                  </button>
                  <button 
                    onClick={handleResetFilters}
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-sm rounded"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Year Filter */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-medium">Year</h4>
                  <div className="flex space-x-2 text-xs">
                    <button 
                      onClick={() => toggleAllYears(true)}
                      className="text-blue-500 hover:underline"
                    >
                      Select All
                    </button>
                    <button 
                      onClick={() => toggleAllYears(false)}
                      className="text-blue-500 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 max-h-28 overflow-y-auto">
                  {availableYears.map(year => (
                    <label key={year} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={yearSelections[year] || false}
                        onChange={e => setYearSelections({...yearSelections, [year]: e.target.checked})}
                        className="mr-1"
                      />
                      <span>{year}</span>
                      <span className="ml-1 text-xs text-gray-500">({yearCounts[year] || 0})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Size Filter */}
              <div className="mb-4">
                <h4 className="font-medium mb-1">Size (Acres)</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">Min</label>
                    <input
                      type="number"
                      value={minAcres}
                      onChange={e => setMinAcres(Math.max(0, parseInt(e.target.value) || 0))}
                      min={0}
                      className="w-full p-1 border rounded dark:bg-zinc-700 dark:border-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">Max</label>
                    <input
                      type="number"
                      value={maxAcres || ''}
                      onChange={e => {
                        const val = e.target.value ? parseInt(e.target.value) : null;
                        setMaxAcres(val);
                      }}
                      min={0}
                      className="w-full p-1 border rounded dark:bg-zinc-700 dark:border-zinc-600"
                    />
                  </div>
                </div>
              </div>

              {/* Cause Filter */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-medium">Cause</h4>
                  <div className="flex space-x-2 text-xs">
                    <button 
                      onClick={() => toggleAllCauses(true)}
                      className="text-blue-500 hover:underline"
                    >
                      Select All
                    </button>
                    <button 
                      onClick={() => toggleAllCauses(false)}
                      className="text-blue-500 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {availableCauses.map(cause => (
                    <label key={cause} className="flex items-center text-sm mb-1">
                      <input
                        type="checkbox"
                        checked={causeSelections[cause] || false}
                        onChange={e => setCauseSelections({...causeSelections, [cause]: e.target.checked})}
                        className="mr-1"
                      />
                      <span>{causeCodes[cause] || `Unknown (${cause})`}</span>
                      <span className="ml-1 text-xs text-gray-500">({causeCounts[cause] || 0})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Agency Filter */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-medium">Agency</h4>
                  <div className="flex space-x-2 text-xs">
                    <button 
                      onClick={() => toggleAllAgencies(true)}
                      className="text-blue-500 hover:underline"
                    >
                      Select All
                    </button>
                    <button 
                      onClick={() => toggleAllAgencies(false)}
                      className="text-blue-500 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {availableAgencies.map(agency => (
                    <label key={agency} className="flex items-center text-sm mb-1">
                      <input
                        type="checkbox"
                        checked={agencySelections[agency] || false}
                        onChange={e => setAgencySelections({...agencySelections, [agency]: e.target.checked})}
                        className="mr-1"
                      />
                      <span>{agency}</span>
                      <span className="ml-1 text-xs text-gray-500">({agencyCounts[agency] || 0})</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FireAnalysisSidebar;
