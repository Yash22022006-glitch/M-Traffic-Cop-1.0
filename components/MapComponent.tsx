
import React from 'react';
import { LatLng } from '../types';

interface MapComponentProps {
  location: LatLng;
  placeName?: string;
  zoom?: number;
}

const MapComponent: React.FC<MapComponentProps> = ({ location, placeName, zoom = 15 }) => {
  // Simplified URL for better reliability in centering on live coordinates
  const mapUrl = `https://maps.google.com/maps?q=${location.latitude},${location.longitude}&z=${zoom}&output=embed&hl=en`;
  
  return (
    <div className="relative w-full h-full bg-gray-700 overflow-hidden">
      <iframe
        key={`${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`}
        src={mapUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        allow="geolocation"
        referrerPolicy="no-referrer-when-downgrade"
        title="Real Location Map"
        className="w-full h-full"
      ></iframe>
      <div className="absolute top-2 left-2 bg-gray-900/80 backdrop-blur-sm p-2 rounded-lg border border-white/10 shadow-xl text-[10px] text-white font-black uppercase tracking-widest pointer-events-none">
        <p className="text-indigo-400 mb-1">{placeName || 'Active Sector'}</p>
        <p className="opacity-60">LAT: {location.latitude.toFixed(5)}</p>
        <p className="opacity-60">LON: {location.longitude.toFixed(5)}</p>
      </div>
    </div>
  );
};

export default MapComponent;