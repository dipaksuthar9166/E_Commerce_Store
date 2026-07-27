import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import {
  X,
  MapPin,
  Crosshair,
  Search,
  Loader2,
  Check,
  Navigation,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { useDeliveryLocation } from '../contexts/LocationContext';
import { useGoogleMapsLoader } from '../hooks/useGoogleMapsLoader';
import {
  hasGoogleMapsKey,
  reverseGeocodeWithMapsJs,
  searchPlacesGoogle,
} from '../utils/googleMaps';

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 };
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  clickableIcons: true,
  gestureHandling: 'greedy',
};

function ModalShell({ children, onClose, subtitle }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        aria-label="Close location picker"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[94vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Delivery location
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function MissingApiKeyContent({ onClose }) {
  return (
    <>
      <div className="m-4 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30 p-4 space-y-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
              Google Maps API key required
            </p>
            <p className="text-xs text-amber-800/90 dark:text-amber-200/80 mt-1 leading-relaxed">
              Add your key in <code className="font-mono text-[11px]">frontend/.env</code>:
            </p>
            <pre className="mt-2 text-[11px] font-mono bg-white/80 dark:bg-slate-900/60 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 overflow-x-auto">
              VITE_GOOGLE_MAPS_API_KEY=your_key_here
            </pre>
            <ol className="mt-3 text-xs text-amber-900/90 dark:text-amber-100/80 space-y-1 list-decimal list-inside">
              <li>Open Google Cloud Console</li>
              <li>
                Enable <strong>Maps JavaScript API</strong>, <strong>Geocoding API</strong>,{' '}
                <strong>Places API</strong>
              </li>
              <li>Create an API key (restrict by HTTP referrer)</li>
              <li>
                Restart <code className="font-mono">npm run dev</code>
              </li>
            </ol>
            <a
              href="https://console.cloud.google.com/google/maps-apis"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-blue-700 dark:text-blue-400 hover:underline"
            >
              Open Google Maps Platform <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600"
        >
          Close
        </button>
      </div>
    </>
  );
}

/** Only mounted when a real API key exists — loads Google Maps JS. */
function GoogleLocationPicker({ onClose }) {
  const {
    lat: savedLat,
    lng: savedLng,
    address: savedAddress,
    setLocation,
    refreshCurrentLocation,
  } = useDeliveryLocation();

  const { isLoaded, loadError } = useGoogleMapsLoader(true);

  const initial = useMemo(() => {
    if (savedLat != null && savedLng != null) {
      return { lat: savedLat, lng: savedLng, address: savedAddress || '' };
    }
    return { ...DEFAULT_CENTER, address: '' };
  }, [savedLat, savedLng, savedAddress]);

  const [draftLat, setDraftLat] = useState(initial.lat);
  const [draftLng, setDraftLng] = useState(initial.lng);
  const [draftAddress, setDraftAddress] = useState(initial.address);
  const [resolving, setResolving] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [localError, setLocalError] = useState('');
  const mapRef = useRef(null);

  useEffect(() => {
    setDraftLat(initial.lat);
    setDraftLng(initial.lng);
    setDraftAddress(initial.address);
    setQuery('');
    setResults([]);
    setLocalError('');
  }, [initial]);

  const resolveAddress = useCallback(async (lat, lng) => {
    setResolving(true);
    setLocalError('');
    try {
      const addr = await reverseGeocodeWithMapsJs(lat, lng);
      setDraftAddress(addr);
    } catch {
      setDraftAddress(`${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`);
      setLocalError('Could not fetch address — you can still confirm this pin.');
    } finally {
      setResolving(false);
    }
  }, []);

  const handlePick = useCallback(
    (lat, lng) => {
      setDraftLat(lat);
      setDraftLng(lng);
      resolveAddress(lat, lng);
      mapRef.current?.panTo({ lat, lng });
    },
    [resolveAddress]
  );

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onMapClick = useCallback(
    (e) => {
      if (!e.latLng) return;
      handlePick(e.latLng.lat(), e.latLng.lng());
    },
    [handlePick]
  );

  const onMarkerDragEnd = useCallback(
    (e) => {
      if (!e.latLng) return;
      handlePick(e.latLng.lat(), e.latLng.lng());
    },
    [handlePick]
  );

  const handleUseCurrent = async () => {
    setGpsLoading(true);
    setLocalError('');
    try {
      const loc = await refreshCurrentLocation();
      if (loc?.lat != null && loc?.lng != null) {
        setDraftLat(loc.lat);
        setDraftLng(loc.lng);
        setDraftAddress(loc.address || '');
        mapRef.current?.panTo({ lat: loc.lat, lng: loc.lng });
        mapRef.current?.setZoom(17);
      }
    } catch (err) {
      setLocalError(
        err?.code === 1
          ? 'Location permission denied. Enable it in browser settings or pick on the map.'
          : 'Could not get GPS. Pick a location on the map instead.'
      );
    } finally {
      setGpsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!query.trim() || query.trim().length < 3) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const items = await searchPlacesGoogle(query, draftLat, draftLng);
        if (!cancelled) setResults(items);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, isLoaded, draftLat, draftLng]);

  const handleSelectResult = (item) => {
    handlePick(item.lat, item.lng);
    setDraftAddress(item.address);
    setQuery('');
    setResults([]);
    mapRef.current?.setZoom(17);
  };

  const handleConfirm = async () => {
    if (draftLat == null || draftLng == null) return;
    setSaving(true);
    try {
      await setLocation({
        lat: draftLat,
        lng: draftLng,
        address: draftAddress,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const center = { lat: Number(draftLat), lng: Number(draftLng) };

  return (
    <>
      <div className="px-4 pt-3 pb-2 shrink-0 relative z-30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search area, street, landmark (Google Places)..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
          )}
        </div>
        {results.length > 0 && (
          <ul className="absolute left-4 right-4 top-full z-40 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl">
            {results.map((item) => (
              <li key={`${item.lat}-${item.lng}-${item.address}`}>
                <button
                  type="button"
                  onClick={() => handleSelectResult(item)}
                  className="w-full text-left px-3 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-500/10 border-b border-slate-50 dark:border-slate-800 last:border-0 flex gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">
                    {item.name && item.name !== item.address ? (
                      <>
                        <span className="font-semibold">{item.name}</span>
                        <span className="text-slate-500"> — {item.address}</span>
                      </>
                    ) : (
                      item.address
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="px-4 pb-2 shrink-0">
        <div
          className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-200"
          style={{ height: 300, width: '100%' }}
        >
          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-rose-600 bg-rose-50">
              Failed to load Google Maps. Check API key, billing, and enabled APIs
              (Maps JavaScript, Geocoding, Places).
            </div>
          )}
          {!isLoaded && !loadError && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              Loading Google Maps…
            </div>
          )}
          {isLoaded && !loadError && (
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER_STYLE}
              center={center}
              zoom={16}
              options={mapOptions}
              onLoad={onMapLoad}
              onClick={onMapClick}
            >
              <Marker position={center} draggable onDragEnd={onMarkerDragEnd} />
            </GoogleMap>
          )}

          <button
            type="button"
            onClick={handleUseCurrent}
            disabled={gpsLoading || !isLoaded}
            className="absolute bottom-3 right-3 z-[2] flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 text-xs font-semibold text-blue-600 shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-800 disabled:opacity-60"
          >
            {gpsLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Crosshair className="w-3.5 h-3.5" />
            )}
            Current location
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 px-0.5">
          Powered by Google Maps · drag the pin or tap the map
        </p>
      </div>

      <div className="px-4 pb-3 flex-1 min-h-0 overflow-y-auto">
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 p-3">
          <div className="flex items-start gap-2">
            <Navigation className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">
                Selected address
              </p>
              {resolving ? (
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Resolving address…
                </p>
              ) : (
                <p className="text-sm text-slate-800 dark:text-slate-100 leading-snug">
                  {draftAddress || 'Move the pin to choose a location'}
                </p>
              )}
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                {Number(draftLat).toFixed(5)}, {Number(draftLng).toFixed(5)}
              </p>
            </div>
          </div>
        </div>
        {localError && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">{localError}</p>
        )}
      </div>

      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex gap-2 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={saving || resolving || draftLat == null || !isLoaded}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Confirm location
        </button>
      </div>
    </>
  );
}

const LocationPickerModal = () => {
  const { isPickerOpen, closePicker } = useDeliveryLocation();

  if (!isPickerOpen) return null;

  if (!hasGoogleMapsKey()) {
    return (
      <ModalShell onClose={closePicker} subtitle="Google Maps API key required">
        <MissingApiKeyContent onClose={closePicker} />
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={closePicker} subtitle="Google Maps — drag pin or search place">
      <GoogleLocationPicker onClose={closePicker} />
    </ModalShell>
  );
};

export default LocationPickerModal;
