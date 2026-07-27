import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { Loader2, AlertTriangle, MapPin } from 'lucide-react';
import { useGoogleMapsLoader } from '../../hooks/useGoogleMapsLoader';
import { DEFAULT_MAP_CENTER, hasGoogleMapsKey } from '../../utils/googleMaps';

const DEFAULT_OPTIONS = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  gestureHandling: 'greedy',
};

/**
 * @param {{ lat: number, lng: number, title?: string, label?: string, color?: 'blue'|'green'|'red'|'purple' }[]} markers
 */
export default function GoogleMapView({
  center,
  zoom = 15,
  markers = [],
  height = 240,
  className = '',
  onClick,
  fitMarkers = true,
  options = {},
}) {
  const { isLoaded, loadError, hasKey } = useGoogleMapsLoader();
  const mapRef = useRef(null);

  const mapCenter = useMemo(() => {
    if (center?.lat != null && center?.lng != null) return center;
    if (markers[0]?.lat != null) return { lat: markers[0].lat, lng: markers[0].lng };
    return DEFAULT_MAP_CENTER;
  }, [center, markers]);

  const fitToMarkers = useCallback(
    (map) => {
      if (!fitMarkers || !markers.length || !window.google?.maps) return;
      if (markers.length === 1) {
        map.setCenter({ lat: markers[0].lat, lng: markers[0].lng });
        map.setZoom(zoom);
        return;
      }
      const bounds = new window.google.maps.LatLngBounds();
      markers.forEach((m) => {
        if (m.lat != null && m.lng != null) bounds.extend({ lat: m.lat, lng: m.lng });
      });
      map.fitBounds(bounds, 48);
    },
    [fitMarkers, markers, zoom]
  );

  const onLoad = useCallback(
    (map) => {
      mapRef.current = map;
      fitToMarkers(map);
    },
    [fitToMarkers]
  );

  useEffect(() => {
    if (mapRef.current) fitToMarkers(mapRef.current);
  }, [fitToMarkers]);

  // Keep single-marker center in sync (live GPS)
  useEffect(() => {
    if (!mapRef.current || markers.length !== 1) return;
    const m = markers[0];
    if (m?.lat == null) return;
    mapRef.current.panTo({ lat: m.lat, lng: m.lng });
  }, [markers]);

  if (!hasGoogleMapsKey() || !hasKey) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 text-center ${className}`}
        style={{ height }}
      >
        <AlertTriangle className="w-6 h-6 text-amber-600" />
        <p className="text-xs font-semibold text-amber-900">
          Add <code className="font-mono">VITE_GOOGLE_MAPS_API_KEY</code> in frontend/.env
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-rose-50 border border-rose-200 rounded-2xl px-4 text-center ${className}`}
        style={{ height }}
      >
        <AlertTriangle className="w-6 h-6 text-rose-500" />
        <p className="text-xs font-semibold text-rose-700">
          Google Maps failed to load. Check API key, billing & enabled APIs.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`flex items-center justify-center gap-2 bg-slate-100 rounded-2xl ${className}`}
        style={{ height }}
      >
        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        <span className="text-xs font-medium text-slate-500">Loading Google Maps…</span>
      </div>
    );
  }

  const pinColors = {
    blue: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    green: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
    red: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
    purple: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-gray-200 ${className}`}
      style={{ height, width: '100%' }}
    >
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={mapCenter}
        zoom={zoom}
        options={{ ...DEFAULT_OPTIONS, ...options }}
        onLoad={onLoad}
        onClick={onClick}
      >
        {markers.map((m, i) =>
          m.lat != null && m.lng != null ? (
            <Marker
              key={m.id || `${m.lat}-${m.lng}-${i}`}
              position={{ lat: Number(m.lat), lng: Number(m.lng) }}
              title={m.title || m.label}
              label={
                m.label
                  ? {
                      text: m.label,
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: '700',
                    }
                  : undefined
              }
              icon={
                m.color && pinColors[m.color]
                  ? {
                      url: pinColors[m.color],
                      scaledSize: window.google?.maps
                        ? new window.google.maps.Size(36, 36)
                        : undefined,
                    }
                  : undefined
              }
            />
          ) : null
        )}
      </GoogleMap>
      {markers.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/90 text-slate-600 px-3 py-1.5 rounded-full shadow">
            <MapPin className="w-3.5 h-3.5 text-blue-600" /> Waiting for location…
          </span>
        </div>
      )}
    </div>
  );
}
