import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export default function StaticMap({ position, popupText, height = '300px' }) {
  const defaultPosition = position || { lat: 28.6139, lng: 77.2090 };

  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm relative z-0" style={{ height }}>
      <MapContainer 
        center={defaultPosition} 
        zoom={15} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={defaultPosition}>
          {popupText && (
            <Popup>
              {popupText}
            </Popup>
          )}
        </Marker>
      </MapContainer>
    </div>
  );
}
