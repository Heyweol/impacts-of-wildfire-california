'use client';

import { useState } from 'react';
import Image from "next/image";
import MapWrapper from '@/components/MapWrapper';
import Toolbar from '@/components/Toolbar';
import Legend from '@/components/Legend';
import { defaultMapStyle } from '@/config/mapStyles';
import { overlayLayers } from '@/config/overlayLayers';

export default function Home() {
  const [activeStyleId, setActiveStyleId] = useState<string>(defaultMapStyle.id);
  const [activeLayerIds, setActiveLayerIds] = useState<string[]>(() =>
    overlayLayers.filter((l) => l.visibleInitially).map((l) => l.id)
  );

  const handleLayerToggle = (layerId: string) => {
    setActiveLayerIds(prev => 
      prev.includes(layerId)
        ? prev.filter(id => id !== layerId) 
        : [...prev, layerId] 
    );
  };

  return (
    <main className="relative h-screen w-screen">
      <MapWrapper 
        activeStyleId={activeStyleId} 
        activeLayerIds={activeLayerIds}
      />
      <Toolbar 
        activeStyleId={activeStyleId} 
        onStyleChange={setActiveStyleId} 
        activeLayerIds={activeLayerIds}
        onLayerToggle={handleLayerToggle}
      />
      <Legend layers={overlayLayers} activeLayerIds={activeLayerIds} />
    </main>
  );
}
