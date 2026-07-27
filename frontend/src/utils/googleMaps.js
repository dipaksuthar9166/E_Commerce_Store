/** Google Maps browser API key (restrict by HTTP referrer in Cloud Console). */
export const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();

export const hasGoogleMapsKey = () => Boolean(GOOGLE_MAPS_API_KEY);

/** Libraries loaded with Maps JS API (stable ref for useJsApiLoader) */
export const GOOGLE_MAPS_LIBRARIES = ['places'];

export const DEFAULT_MAP_CENTER = { lat: 28.6139, lng: 77.209 }; // New Delhi

/** Google Maps directions deep link */
export function googleDirectionsUrl(destinationAddressOrLatLng, origin) {
  const dest =
    typeof destinationAddressOrLatLng === 'string'
      ? destinationAddressOrLatLng
      : `${destinationAddressOrLatLng.lat},${destinationAddressOrLatLng.lng}`;
  let url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
  if (origin?.lat != null && origin?.lng != null) {
    url += `&origin=${encodeURIComponent(`${origin.lat},${origin.lng}`)}`;
  }
  return url;
}

/**
 * Forward geocode address → { lat, lng } via Geocoding REST.
 */
export async function geocodeAddressGoogle(address) {
  if (!hasGoogleMapsKey()) throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY');
  if (!address?.trim()) throw new Error('Empty address');
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json` +
    `?address=${encodeURIComponent(address.trim())}` +
    `&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}` +
    `&language=en&region=in`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding request failed');
  const data = await res.json();
  if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
    const { lat, lng } = data.results[0].geometry.location;
    return {
      lat,
      lng,
      address: data.results[0].formatted_address,
    };
  }
  throw new Error(data.error_message || data.status || 'Geocode failed');
}

/**
 * Reverse geocode via Google Geocoding REST API.
 * Works before Maps JS is loaded (navbar bootstrap / GPS).
 */
export async function reverseGeocodeGoogle(lat, lng) {
  if (!hasGoogleMapsKey()) {
    throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY');
  }
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json` +
    `?latlng=${encodeURIComponent(lat)},${encodeURIComponent(lng)}` +
    `&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}` +
    `&language=en`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding request failed');
  const data = await res.json();

  if (data.status === 'OK' && data.results?.[0]?.formatted_address) {
    return data.results[0].formatted_address;
  }
  if (data.status === 'ZERO_RESULTS') {
    return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
  }
  const msg = data.error_message || data.status || 'Geocoding failed';
  throw new Error(msg);
}

/**
 * Reverse geocode using already-loaded Maps JS Geocoder (no extra HTTP quota style).
 */
export function reverseGeocodeWithMapsJs(lat, lng) {
  return new Promise((resolve, reject) => {
    if (!window.google?.maps?.Geocoder) {
      reject(new Error('Google Maps JS not loaded'));
      return;
    }
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat: Number(lat), lng: Number(lng) } }, (results, status) => {
      if (status === 'OK' && results?.[0]?.formatted_address) {
        resolve(results[0].formatted_address);
      } else if (status === 'ZERO_RESULTS') {
        resolve(`${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`);
      } else {
        reject(new Error(status || 'Geocode failed'));
      }
    });
  });
}

/**
 * Text search via Places TextSearchService (requires Maps JS + places library).
 */
export function searchPlacesGoogle(query, biasLat, biasLng) {
  return new Promise((resolve, reject) => {
    if (!query?.trim()) {
      resolve([]);
      return;
    }
    if (!window.google?.maps?.places) {
      reject(new Error('Google Places not loaded'));
      return;
    }

    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    /** @type {google.maps.places.TextSearchRequest} */
    const request = {
      query: query.trim(),
    };
    if (biasLat != null && biasLng != null) {
      request.location = new window.google.maps.LatLng(biasLat, biasLng);
      request.radius = 50000;
    }

    service.textSearch(request, (results, status) => {
      if (
        status === window.google.maps.places.PlacesServiceStatus.OK ||
        status === 'OK'
      ) {
        resolve(
          (results || []).slice(0, 6).map((place) => ({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address || place.name,
            name: place.name,
          }))
        );
        return;
      }
      if (
        status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS ||
        status === 'ZERO_RESULTS'
      ) {
        resolve([]);
        return;
      }
      reject(new Error(String(status)));
    });
  });
}
