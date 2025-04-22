'use client';

import { useState, useCallback } from 'react';
import MapWrapper from '@/components/MapWrapper';
import Toolbar from '@/components/Toolbar';
import Legend from '@/components/Legend';
import FilterSlider from '@/components/FilterSlider';
import { defaultMapStyle } from '@/config/mapStyles';
import { overlayLayers } from '@/config/overlayLayers';

export default function Home() {
  const [activeStyleId, setActiveStyleId] = useState<string>(defaultMapStyle.id);
  const [activeLayerIds, setActiveLayerIds] = useState<string[]>(() =>
    overlayLayers.filter((l) => l.visibleInitially).map((l) => l.id)
  );
  const [minIncidentSize, setMinIncidentSize] = useState<number>(0); // Current filter value
  const [dataMinSize, setDataMinSize] = useState<number | null>(null); // Actual min from data
  const [dataMaxSize, setDataMaxSize] = useState<number | null>(null); // Actual max from data

  const handleLayerToggle = (layerId: string) => {
    setActiveLayerIds(prev => 
      prev.includes(layerId)
        ? prev.filter(id => id !== layerId) 
        : [...prev, layerId] 
    );
  };

  const handleFilterChange = (value: number) => {
    setMinIncidentSize(value);
  };

  // Wrap callback in useCallback to stabilize its reference
  const handleDataRangeLoad = useCallback((min: number, max: number) => {
    console.log(`page.tsx received data range: ${min} - ${max}`);
    setDataMinSize(min);
    setDataMaxSize(max);
  }, []); // Empty dependency array means this function is created once

  const isFireLayerActive = activeLayerIds.includes('us-fire-events-wfigs');

  return (
    <main className="relative h-screen w-screen">
      <MapWrapper 
        activeStyleId={activeStyleId} 
        activeLayerIds={activeLayerIds}
        minIncidentSize={minIncidentSize}
        onDataRangeLoad={handleDataRangeLoad} // Pass callback down
      />
      <Toolbar 
        activeStyleId={activeStyleId} 
        onStyleChange={setActiveStyleId} 
        activeLayerIds={activeLayerIds}
        onLayerToggle={handleLayerToggle}
      />
      <Legend layers={overlayLayers} activeLayerIds={activeLayerIds} />

      {isFireLayerActive && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-1/3 min-w-[300px]">
          <FilterSlider
            // Use calculated range from data, provide defaults while loading
            min={dataMinSize ?? 0} 
            max={dataMaxSize ?? 100000} 
            // Calculate step dynamically or keep fixed? Fixed for now.
            step={Math.max(1, Math.round(( (dataMaxSize ?? 100000) - (dataMinSize ?? 0) ) / 100))} // Aim for ~100 steps
            value={minIncidentSize}
            onChange={handleFilterChange}
            label="Min Fire Size"
            unit="acres"
            // Disable if layer isn't active OR data range hasn't loaded yet
            disabled={!isFireLayerActive || dataMinSize === null}
          />
        </div>
      )}
    </main>
  );
}
