import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X, MapPin, Crosshair, Loader2, Check, Navigation, Search } from 'lucide-react';
import { useDeliveryLocation } from '../contexts/LocationContext';
import { motion, AnimatePresence } from 'framer-motion';
import LocationPickerMap from './LocationPickerMap';

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 };

async function reverseGeocodeOSM(lat, lng) {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
  const data = await res.json();
  if (data && data.display_name) {
    return data.display_name;
  }
  throw new Error('Address not found');
}

async function searchPlacesOSM(query) {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
  const data = await res.json();
  return data.map(item => ({
    name: item.name,
    address: item.display_name,
    lat: Number(item.lat),
    lng: Number(item.lon)
  }));
}

function ModalShell({ children, onClose, subtitle }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        type="button"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        aria-label="Close location picker"
        onClick={onClose}
      />
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full sm:max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col"
      >
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
      </motion.div>
    </div>
  );
}

function OSMLocationPicker({ onClose }) {
  const {
    lat: savedLat,
    lng: savedLng,
    address: savedAddress,
    setLocation,
    refreshCurrentLocation,
  } = useDeliveryLocation();

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

  const resolveAddress = useCallback(async (lat, lng) => {
    setResolving(true);
    setLocalError('');
    try {
      const addr = await reverseGeocodeOSM(lat, lng);
      setDraftAddress(addr);
    } catch {
      setDraftAddress(`${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`);
      setLocalError('Could not fetch address — you can still confirm this pin.');
    } finally {
      setResolving(false);
    }
  }, []);

  const handlePick = useCallback(
    (position) => {
      setDraftLat(position.lat);
      setDraftLng(position.lng);
      resolveAddress(position.lat, position.lng);
    },
    [resolveAddress]
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
    if (!query.trim() || query.trim().length < 3) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const items = await searchPlacesOSM(query);
        if (!cancelled) setResults(items);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 800); // Increased debounce to avoid rate limits
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const handleSelectResult = (item) => {
    setDraftLat(item.lat);
    setDraftLng(item.lng);
    setDraftAddress(item.address);
    setQuery('');
    setResults([]);
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

  return (
    <>
      <div className="px-4 pt-3 pb-2 shrink-0 relative z-30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search area, street, landmark (OpenStreetMap)..."
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
                  <span className="line-clamp-2">{item.address}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="px-4 pb-2 shrink-0">
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <LocationPickerMap 
            initialPosition={{ lat: draftLat, lng: draftLng }} 
            onLocationSelect={handlePick} 
          />
          <button
            type="button"
            onClick={handleUseCurrent}
            disabled={gpsLoading}
            className="absolute bottom-3 right-3 z-[1000] flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 text-xs font-semibold text-blue-600 shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-800 disabled:opacity-60"
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
          Powered by Leaflet & OpenStreetMap · drag the map and click to set pin
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
                  {draftAddress || 'Tap the map to choose a location'}
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
          disabled={saving || resolving || draftLat == null}
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

  return (
    <AnimatePresence>
      {isPickerOpen && (
        <ModalShell onClose={closePicker} subtitle="OpenStreetMap — click on map or search place">
          <OSMLocationPicker onClose={closePicker} />
        </ModalShell>
      )}
    </AnimatePresence>
  );
};

export default LocationPickerModal;
