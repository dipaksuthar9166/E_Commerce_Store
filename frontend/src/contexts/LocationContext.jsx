import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  hasGoogleMapsKey,
  reverseGeocodeGoogle,
  reverseGeocodeWithMapsJs,
} from '../utils/googleMaps';

const STORAGE_KEY = 'mersko_delivery_location';

const LocationContext = createContext({
  lat: null,
  lng: null,
  address: '',
  shortAddress: '',
  loading: true,
  error: null,
  isPickerOpen: false,
  hasMapsKey: false,
  openPicker: () => {},
  closePicker: () => {},
  setLocation: () => {},
  refreshCurrentLocation: async () => {},
});

export const useDeliveryLocation = () => useContext(LocationContext);

/** @deprecated use useDeliveryLocation — avoids clash with react-router useLocation */
export const useLocation = useDeliveryLocation;

/** Short label for navbar (area / city). */
export function toShortAddress(fullAddress = '') {
  if (!fullAddress) return 'Select location';
  const parts = fullAddress
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return 'Select location';
  if (parts.length === 1) return parts[0].slice(0, 36);
  return `${parts[0]}, ${parts[1]}`.slice(0, 42);
}

/** Prefer Google Geocoding; Maps JS if already loaded. */
export async function reverseGeocode(lat, lng) {
  if (window.google?.maps?.Geocoder) {
    try {
      return await reverseGeocodeWithMapsJs(lat, lng);
    } catch {
      /* fall through to REST */
    }
  }
  if (hasGoogleMapsKey()) {
    return reverseGeocodeGoogle(lat, lng);
  }
  throw new Error('Google Maps API key missing (VITE_GOOGLE_MAPS_API_KEY)');
}

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.lat === 'number' &&
      typeof parsed?.lng === 'number' &&
      parsed.address
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function saveStored(loc) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  } catch {
    /* ignore */
  }
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 60_000,
    });
  });
}

export const LocationProvider = ({ children }) => {
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const mapsKeyOk = hasGoogleMapsKey();

  const applyLocation = useCallback((nextLat, nextLng, nextAddress) => {
    setLat(nextLat);
    setLng(nextLng);
    setAddress(nextAddress);
    setError(null);
    saveStored({ lat: nextLat, lng: nextLng, address: nextAddress });
  }, []);

  const setLocation = useCallback(
    async ({ lat: nextLat, lng: nextLng, address: nextAddress }) => {
      let resolved = nextAddress;
      if (!resolved && nextLat != null && nextLng != null) {
        try {
          resolved = await reverseGeocode(nextLat, nextLng);
        } catch {
          resolved = `${Number(nextLat).toFixed(5)}, ${Number(nextLng).toFixed(5)}`;
        }
      }
      applyLocation(Number(nextLat), Number(nextLng), resolved || '');
    },
    [applyLocation]
  );

  const refreshCurrentLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await getCurrentPosition();
      const nextLat = pos.coords.latitude;
      const nextLng = pos.coords.longitude;
      let nextAddress;
      try {
        nextAddress = await reverseGeocode(nextLat, nextLng);
      } catch {
        nextAddress = `${nextLat.toFixed(5)}, ${nextLng.toFixed(5)}`;
      }
      applyLocation(nextLat, nextLng, nextAddress);
      return { lat: nextLat, lng: nextLng, address: nextAddress };
    } catch (err) {
      let message = 'Could not get your current location.';
      if (err?.code === 1) message = 'Location permission denied. Please enable it or pick on the map.';
      else if (err?.code === 2) message = 'Location unavailable. Pick a place on the map.';
      else if (err?.code === 3) message = 'Location request timed out. Try again or pick on the map.';
      else if (err?.message) message = err.message;
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [applyLocation]);

  // Bootstrap: stored location first, else browser GPS + Google reverse geocode
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const stored = loadStored();
      if (stored) {
        if (!cancelled) {
          setLat(stored.lat);
          setLng(stored.lng);
          setAddress(stored.address);
          setLoading(false);
        }
        return;
      }

      try {
        const pos = await getCurrentPosition();
        if (cancelled) return;
        const nextLat = pos.coords.latitude;
        const nextLng = pos.coords.longitude;
        let nextAddress;
        try {
          nextAddress = await reverseGeocode(nextLat, nextLng);
        } catch {
          nextAddress = `${nextLat.toFixed(5)}, ${nextLng.toFixed(5)}`;
        }
        if (!cancelled) applyLocation(nextLat, nextLng, nextAddress);
      } catch (err) {
        if (cancelled) return;
        let message = 'Select your delivery location';
        if (err?.code === 1) message = 'Allow location or choose on map';
        if (!mapsKeyOk) message = 'Add Google Maps API key to enable map';
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [applyLocation, mapsKeyOk]);

  const value = useMemo(
    () => ({
      lat,
      lng,
      address,
      shortAddress: toShortAddress(address),
      loading,
      error,
      isPickerOpen,
      hasMapsKey: mapsKeyOk,
      openPicker: () => setIsPickerOpen(true),
      closePicker: () => setIsPickerOpen(false),
      setLocation,
      refreshCurrentLocation,
    }),
    [
      lat,
      lng,
      address,
      loading,
      error,
      isPickerOpen,
      mapsKeyOk,
      setLocation,
      refreshCurrentLocation,
    ]
  );

  return (
    <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
  );
};

export default LocationContext;
