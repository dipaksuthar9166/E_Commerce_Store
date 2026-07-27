import { useJsApiLoader } from '@react-google-maps/api';
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_LIBRARIES,
  hasGoogleMapsKey,
} from '../utils/googleMaps';

/**
 * Shared Google Maps JS loader (one script for whole app).
 * Only call when hasGoogleMapsKey() is true, or pass skip.
 */
export function useGoogleMapsLoader(enabled = true) {
  const keyOk = hasGoogleMapsKey() && enabled;

  const result = useJsApiLoader({
    id: 'mersko-google-maps',
    googleMapsApiKey: keyOk ? GOOGLE_MAPS_API_KEY : 'disabled',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  if (!keyOk) {
    return {
      isLoaded: false,
      loadError: new Error('Missing VITE_GOOGLE_MAPS_API_KEY'),
      hasKey: false,
    };
  }

  return { ...result, hasKey: true };
}
