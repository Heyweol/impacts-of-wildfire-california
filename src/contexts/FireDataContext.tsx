'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Feature, FeatureCollection, Geometry } from 'geojson';

// Define the fire data properties based on the ArcGIS API response
export interface FireProperties {
  OBJECTID: number;
  YEAR_: number;
  STATE?: string;
  AGENCY?: string;
  UNIT_ID?: string;
  FIRE_NAME?: string;
  INC_NUM?: string;
  ALARM_DATE?: string;
  CONT_DATE?: string;
  CAUSE?: number;
  C_METHOD?: number;
  OBJECTIVE?: number;
  GIS_ACRES?: number;
  COMMENTS?: string;
  COMPLEX_NAME?: string;
  IRWINID?: string;
  FIRE_NUM?: string;
  COMPLEX_ID?: string;
  DECADES?: number;
  Shape__Area?: number;
  Shape__Length?: number;
}

export type FireFeature = Feature<Geometry, FireProperties>;
export type FireFeatureCollection = FeatureCollection<Geometry, FireProperties>;

// Define filter options
export interface FireFilters {
  years: number[];
  minAcres: number;
  maxAcres: number | null;
  causes: number[] | null;
  agencies: string[] | null;
}

// Define the context shape
interface FireDataContextType {
  // Raw data
  fireData: FireFeatureCollection | null;
  isLoading: boolean;
  error: string | null;
  
  // Filtered data
  filteredData: FireFeatureCollection | null;
  filtersApplied: boolean;
  
  // Filter state
  filters: FireFilters;
  setFilters: (filters: FireFilters) => void;
  
  // Statistics
  totalFires: number;
  totalAcres: number;
  yearCounts: Record<number, number>;
  causeCounts: Record<number, number>;
  agencyCounts: Record<string, number>;
  
  // Filter options (available values)
  availableYears: number[];
  availableCauses: number[];
  availableAgencies: string[];
  minPossibleAcres: number;
  maxPossibleAcres: number;
  
  // Actions
  refreshData: () => Promise<void>;
  resetFilters: () => void;
}

// Create the context with default values
const FireDataContext = createContext<FireDataContextType | undefined>(undefined);

// Default filters
const defaultFilters: FireFilters = {
  years: [2018, 2019, 2020, 2021, 2022, 2023],
  minAcres: 0,
  maxAcres: null,
  causes: null,
  agencies: null,
};

// Cause codes mapping for reference
export const causeCodes: Record<number, string> = {
  1: 'Lightning',
  2: 'Equipment Use',
  3: 'Smoking',
  4: 'Campfire',
  5: 'Debris',
  6: 'Railroad',
  7: 'Arson',
  8: 'Playing with fire',
  9: 'Miscellaneous',
  10: 'Vehicle',
  11: 'Powerline',
  12: 'Firefighter Training',
  13: 'Non-Firefighter Training',
  14: 'Unknown / Unidentified',
  15: 'Structure',
  16: 'Aircraft',
  17: 'Volcanic',
  18: 'Escaped Prescribed Burn',
  19: 'Illegal Alien Campfire'
};

interface FireDataProviderProps {
  children: ReactNode;
}

export const FireDataProvider: React.FC<FireDataProviderProps> = ({ children }) => {
  // State for raw data
  const [fireData, setFireData] = useState<FireFeatureCollection | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for filters
  const [filters, setFilters] = useState<FireFilters>(defaultFilters);
  
  // State for filtered data
  const [filteredData, setFilteredData] = useState<FireFeatureCollection | null>(null);
  
  // Flag to track if filters have been applied
  const [filtersApplied, setFiltersApplied] = useState<boolean>(false);
  
  // Derived state for statistics and filter options
  const [stats, setStats] = useState({
    totalFires: 0,
    totalAcres: 0,
    yearCounts: {} as Record<number, number>,
    causeCounts: {} as Record<number, number>,
    agencyCounts: {} as Record<string, number>,
    availableYears: [] as number[],
    availableCauses: [] as number[],
    availableAgencies: [] as string[],
    minPossibleAcres: 0,
    maxPossibleAcres: 0,
  });
  
  // Function to fetch fire data
  const fetchFireData = useCallback(async (): Promise<FireFeatureCollection> => {
    const url = 'https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/California_Historic_Fire_Perimeters/FeatureServer/0/query';
    
    // Parameters for the query
    const params = new URLSearchParams({
      where: 'YEAR_>=2018',
      outFields: '*',
      f: 'geojson',
      outSR: '4326',
      resultRecordCount: '2000' // Increased to get more data
    });
    
    try {
      // Use AbortController to handle request cancellations gracefully
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60-second timeout
      
      const response = await fetch(`${url}?${params.toString()}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch fire data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data as FireFeatureCollection;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.warn('Fire data request was aborted - likely due to timeout or component unmount');
        throw new Error('Request timeout: The server took too long to respond');
      }
      throw error;
    }
  }, []);
  
  // Function to refresh data
  const refreshData = useCallback(async (): Promise<void> => {
    // If already loading, don't start another request
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchFireData();
      // Only update if we have valid data
      if (data && data.features) {
        console.log(`Successfully loaded ${data.features.length} fire features`);
        setFireData(data);
      } else {
        throw new Error('Received invalid data from server');
      }
    } catch (err) {
      // Don't show aborted request errors to the user if the component unmounted
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message || 'Unknown error occurred');
        console.error('Error fetching fire data:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, fetchFireData]);
  
  // Function to reset filters to default
  const resetFilters = (): void => {
    setFilters(defaultFilters);
    setFiltersApplied(true); // Ensure map updates
  };
  
  // Use a ref to track if initial fetch has happened
  const initialFetchDone = useRef(false);
  
  // Effect to fetch initial data only once
  useEffect(() => {
    if (!initialFetchDone.current) {
      refreshData();
      initialFetchDone.current = true;
    }
  }, [refreshData]);
  
  // Effect to compute statistics and filter options when raw data changes
  useEffect(() => {
    if (!fireData || !fireData.features) return;
    
    const yearCounts: Record<number, number> = {};
    const causeCounts: Record<number, number> = {};
    const agencyCounts: Record<string, number> = {};
    const years = new Set<number>();
    const causes = new Set<number>();
    const agencies = new Set<string>();
    let totalAcres = 0;
    let minAcres = Infinity;
    let maxAcres = 0;
    
    // Process each feature to compute statistics
    fireData.features.forEach(feature => {
      const props = feature.properties;
      if (!props) return;
      
      // Year counts
      const year = props.YEAR_;
      if (year) {
        yearCounts[year] = (yearCounts[year] || 0) + 1;
        years.add(year);
      }
      
      // Cause counts
      const cause = props.CAUSE;
      if (cause !== undefined && cause !== null) {
        causeCounts[cause] = (causeCounts[cause] || 0) + 1;
        causes.add(cause);
      }
      
      // Agency counts
      const agency = props.AGENCY;
      if (agency) {
        agencyCounts[agency] = (agencyCounts[agency] || 0) + 1;
        agencies.add(agency);
      }
      
      // Acres statistics
      const acres = props.GIS_ACRES;
      if (acres !== undefined && acres !== null) {
        totalAcres += acres;
        minAcres = Math.min(minAcres, acres);
        maxAcres = Math.max(maxAcres, acres);
      }
    });
    
    setStats({
      totalFires: fireData.features.length,
      totalAcres,
      yearCounts,
      causeCounts,
      agencyCounts,
      availableYears: Array.from(years).sort(),
      availableCauses: Array.from(causes).sort(),
      availableAgencies: Array.from(agencies).sort(),
      minPossibleAcres: minAcres === Infinity ? 0 : minAcres,
      maxPossibleAcres: maxAcres,
    });
    
  }, [fireData]);
  
  // Effect to apply filters when filters or raw data changes
  useEffect(() => {
    if (!fireData || !fireData.features) {
      setFilteredData(null);
      return;
    }
    
    // Apply filters to the raw data
    const filtered = {
      ...fireData,
      features: fireData.features.filter(feature => {
        const props = feature.properties;
        if (!props) return false;
        
        // Filter by year
        if (filters.years && filters.years.length > 0) {
          if (!props.YEAR_ || !filters.years.includes(props.YEAR_)) {
            return false;
          }
        }
        
        // Filter by acres
        if (props.GIS_ACRES !== undefined && props.GIS_ACRES !== null) {
          if (props.GIS_ACRES < filters.minAcres) {
            return false;
          }
          if (filters.maxAcres !== null && props.GIS_ACRES > filters.maxAcres) {
            return false;
          }
        }
        
        // Filter by cause
        if (filters.causes && filters.causes.length > 0) {
          if (props.CAUSE === undefined || props.CAUSE === null || !filters.causes.includes(props.CAUSE)) {
            return false;
          }
        }
        
        // Filter by agency
        if (filters.agencies && filters.agencies.length > 0) {
          if (!props.AGENCY || !filters.agencies.includes(props.AGENCY)) {
            return false;
          }
        }
        
        return true;
      })
    };
    
    console.log('Applying filters resulted in', filtered.features.length, 'features out of', fireData.features.length);
    setFilteredData(filtered);
    setFiltersApplied(true);
    
  }, [fireData, filters]);
  
  // Calculate filtered statistics
  const filteredStats = React.useMemo(() => {
    if (!filteredData || !filteredData.features) {
      return {
        totalFires: 0,
        totalAcres: 0,
        yearCounts: {},
        causeCounts: {},
        agencyCounts: {},
      };
    }
    
    const yearCounts: Record<number, number> = {};
    const causeCounts: Record<number, number> = {};
    const agencyCounts: Record<string, number> = {};
    let totalAcres = 0;
    
    // Process each feature to compute statistics
    filteredData.features.forEach(feature => {
      const props = feature.properties;
      if (!props) return;
      
      // Year counts
      const year = props.YEAR_;
      if (year) {
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      }
      
      // Cause counts
      const cause = props.CAUSE;
      if (cause !== undefined && cause !== null) {
        causeCounts[cause] = (causeCounts[cause] || 0) + 1;
      }
      
      // Agency counts
      const agency = props.AGENCY;
      if (agency) {
        agencyCounts[agency] = (agencyCounts[agency] || 0) + 1;
      }
      
      // Acres statistics
      const acres = props.GIS_ACRES;
      if (acres !== undefined && acres !== null) {
        totalAcres += acres;
      }
    });
    
    return {
      totalFires: filteredData.features.length,
      totalAcres,
      yearCounts,
      causeCounts,
      agencyCounts,
    };
  }, [filteredData]);
  
  // Provide the context value
  const contextValue: FireDataContextType = {
    fireData,
    isLoading,
    error,
    filteredData,
    filtersApplied,
    filters,
    setFilters,
    // Use filtered stats when filters are applied, otherwise use full stats
    totalFires: filtersApplied ? filteredStats.totalFires : stats.totalFires,
    totalAcres: filtersApplied ? filteredStats.totalAcres : stats.totalAcres,
    yearCounts: filtersApplied ? filteredStats.yearCounts : stats.yearCounts,
    causeCounts: filtersApplied ? filteredStats.causeCounts : stats.causeCounts,
    agencyCounts: filtersApplied ? filteredStats.agencyCounts : stats.agencyCounts,
    availableYears: stats.availableYears,
    availableCauses: stats.availableCauses,
    availableAgencies: stats.availableAgencies,
    minPossibleAcres: stats.minPossibleAcres,
    maxPossibleAcres: stats.maxPossibleAcres,
    refreshData,
    resetFilters,
  };
  
  return (
    <FireDataContext.Provider value={contextValue}>
      {children}
    </FireDataContext.Provider>
  );
};

// Custom hook to use the fire data context
export const useFireData = (): FireDataContextType => {
  const context = useContext(FireDataContext);
  if (context === undefined) {
    throw new Error('useFireData must be used within a FireDataProvider');
  }
  return context;
};
