import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, MapPin } from 'lucide-react';

// Fix Leaflet's default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom colored icons
const createIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const icons = {
  blue: createIcon('blue'),
  green: createIcon('green'),
  red: createIcon('red'),
  purple: createIcon('violet'),
  gold: createIcon('gold')
};

// Component to dynamically fit bounds when markers change
const FitBounds = ({ markers, center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [30, 30] });
    } else if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], zoom);
    } else if (center) {
      map.setView([center.lat, center.lng], zoom);
    }
  }, [markers, center, zoom, map]);

  return null;
};

export default function LeafletMapView({
  center,
  zoom = 15,
  markers = [],
  height = 240,
  className = '',
  fitMarkers = true,
}) {
  const defaultCenter = [20.5937, 78.9629]; // India center fallback
  const mapCenter = center?.lat && center?.lng 
    ? [center.lat, center.lng] 
    : markers[0]?.lat 
      ? [markers[0].lat, markers[0].lng] 
      : defaultCenter;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-gray-200 ${className}`} style={{ height, width: '100%' }}>
      <MapContainer 
        center={mapCenter} 
        zoom={zoom} 
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {fitMarkers && <FitBounds markers={markers} center={center} zoom={zoom} />}

        {markers.map((m, i) => {
          if (m.lat == null || m.lng == null) return null;
          return (
            <Marker 
              key={m.id || `${m.lat}-${m.lng}-${i}`} 
              position={[m.lat, m.lng]}
              icon={icons[m.color] || icons.blue}
            >
              {(m.title || m.label) && (
                <Popup>
                  <span className="font-semibold">{m.title || m.label}</span>
                </Popup>
              )}
            </Marker>
          );
        })}
      </MapContainer>

      {markers.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/90 text-slate-600 px-3 py-1.5 rounded-full shadow">
            <MapPin className="w-3.5 h-3.5 text-blue-600" /> Waiting for location…
          </span>
        </div>
      )}
    </div>
  );
}
