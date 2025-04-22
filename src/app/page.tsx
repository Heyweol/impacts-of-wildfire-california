'use client';

import { useState } from 'react';
import Image from "next/image";
import MapWrapper from '@/components/MapWrapper';
import Toolbar from '@/components/Toolbar';
import { defaultMapStyle } from '@/config/mapStyles';

export default function Home() {
  const [activeStyleId, setActiveStyleId] = useState<string>(defaultMapStyle.id);

  return (
    <main className="relative h-screen w-screen">
      <MapWrapper activeStyleId={activeStyleId} />
      <Toolbar 
        activeStyleId={activeStyleId} 
        onStyleChange={setActiveStyleId} 
      />
    </main>
  );
}
