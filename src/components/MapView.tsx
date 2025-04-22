import React, { useRef, useEffect, useState } from 'react';
import maplibregl, { Map, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapStyles, defaultMapStyle } from '@/config/mapStyles';

// Define props
interface MapViewProps {
  activeStyleId: string;
}

const MapView: React.FC<MapViewProps> = ({ activeStyleId }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const [lng] = useState(-98.5795); // Approx center of US
  const [lat] = useState(39.8283);
  const [zoom] = useState(4.5);

  // Find the initial style object based on the activeStyleId prop
  const initialStyle = mapStyles.find(style => style.id === activeStyleId)?.style || defaultMapStyle.style;

  useEffect(() => {
    if (map.current || !mapContainer.current) return; // Initialize map only once and if container exists

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: initialStyle, // Use initial style
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Clean up on unmount
    return () => {
      map.current?.remove();
      map.current = null;
    };
  // Disable eslint warning because initialStyle should only be used on first mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lng, lat, zoom]); // Only re-run if center/zoom change (won't here)

  // Effect to update style when activeStyleId changes
  useEffect(() => {
    if (!map.current) return; // Make sure map is initialized

    const newStyle = mapStyles.find(style => style.id === activeStyleId)?.style;
    if (newStyle) {
      try {
        map.current.setStyle(newStyle);
      } catch (error) {
        console.error("Error setting map style:", error);
        // Potentially show an error message to the user
      }
    }
  }, [activeStyleId]); // Re-run only when activeStyleId changes

  return <div ref={mapContainer} className="w-full h-full absolute top-0 left-0" />;
};

export default MapView;
