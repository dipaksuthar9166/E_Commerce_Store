import { useEffect, useRef, useState } from 'react';

/**
 * Browser GPS watch — updates lat/lng continuously.
 * @param {boolean} enabled
 */
export function useWatchPosition(enabled = true) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      setLoading(false);
      return;
    }

    setLoading(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        let message = 'Could not get location';
        if (err.code === 1) message = 'Location permission denied';
        else if (err.code === 2) message = 'Location unavailable';
        else if (err.code === 3) message = 'Location timed out';
        setError(message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled]);

  return { position, error, loading };
}
