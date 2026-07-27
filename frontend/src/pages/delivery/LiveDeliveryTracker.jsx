import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, MapPin, Navigation, Crosshair } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useWatchPosition } from '../../hooks/useWatchPosition';
import GoogleMapView from '../../components/maps/GoogleMapView';
import {
  geocodeAddressGoogle,
  googleDirectionsUrl,
  reverseGeocodeGoogle,
  hasGoogleMapsKey,
} from '../../utils/googleMaps';

/**
 * Live GPS tracker for an active delivery order.
 * Broadcasts rider position over Socket.IO → customer order_track room.
 */
const LiveDeliveryTracker = ({
  orderId,
  dropAddress,
  shopAddress,
  compact = false,
  enabled = true,
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { position, error: gpsError, loading: gpsLoading } = useWatchPosition(enabled && Boolean(orderId));

  const [address, setAddress] = useState('');
  const [dropCoords, setDropCoords] = useState(null);
  const [shopCoords, setShopCoords] = useState(null);

  // Reverse geocode rider GPS
  useEffect(() => {
    if (!position || !hasGoogleMapsKey()) return;
    let cancelled = false;
    reverseGeocodeGoogle(position.lat, position.lng)
      .then((addr) => {
        if (!cancelled) setAddress(addr);
      })
      .catch(() => {
        if (!cancelled) {
          setAddress(`${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [position?.lat, position?.lng]);

  // Geocode drop / shop once
  useEffect(() => {
    if (!hasGoogleMapsKey()) return;
    let cancelled = false;

    const run = async () => {
      if (dropAddress) {
        try {
          const c = await geocodeAddressGoogle(dropAddress);
          if (!cancelled) setDropCoords({ lat: c.lat, lng: c.lng });
        } catch {
          /* ignore */
        }
      }
      if (shopAddress) {
        try {
          const c = await geocodeAddressGoogle(shopAddress);
          if (!cancelled) setShopCoords({ lat: c.lat, lng: c.lng });
        } catch {
          /* ignore */
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [dropAddress, shopAddress]);

  // Broadcast GPS to backend + customer continuously (no page refresh needed)
  useEffect(() => {
    if (!enabled || !socket || !orderId || !position || !user?._id) return;

    const push = () => {
      socket.emit('updateLocation', {
        orderId: String(orderId),
        deliveryBoyId: user._id,
        lat: position.lat,
        lng: position.lng,
      });
    };

    push();
    const t = setInterval(push, 3000);
    const onConnect = () => push();
    socket.on('connect', onConnect);
    socket.on('reconnect', onConnect);

    return () => {
      clearInterval(t);
      socket.off('connect', onConnect);
      socket.off('reconnect', onConnect);
    };
  }, [enabled, socket, orderId, position?.lat, position?.lng, user?._id]);

  const markers = useMemo(() => {
    const list = [];
    if (shopCoords) {
      list.push({
        id: 'shop',
        lat: shopCoords.lat,
        lng: shopCoords.lng,
        title: 'Pickup',
        color: 'blue',
      });
    }
    if (position) {
      list.push({
        id: 'rider',
        lat: position.lat,
        lng: position.lng,
        title: 'You (rider)',
        color: 'purple',
      });
    }
    if (dropCoords) {
      list.push({
        id: 'drop',
        lat: dropCoords.lat,
        lng: dropCoords.lng,
        title: 'Customer drop',
        color: 'green',
      });
    }
    return list;
  }, [position, dropCoords, shopCoords]);

  const directionsHref = dropAddress
    ? googleDirectionsUrl(dropAddress, position)
    : dropCoords
      ? googleDirectionsUrl(dropCoords, position)
      : null;

  if (!orderId) return null;

  return (
    <div
      className={
        compact
          ? 'space-y-2'
          : 'bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'
      }
    >
      {!compact && (
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Crosshair className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900">Live GPS tracking</p>
              <p className="text-[11px] text-gray-500 truncate">
                Order #{String(orderId).slice(-6).toUpperCase()}
              </p>
            </div>
          </div>
          {directionsHref && (
            <a
              href={directionsHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg shrink-0"
            >
              <Navigation className="w-3.5 h-3.5" /> Navigate
            </a>
          )}
        </div>
      )}

      <div className={compact ? '' : 'p-3 pt-2'}>
        <GoogleMapView
          height={compact ? 200 : 260}
          zoom={15}
          center={position || dropCoords || shopCoords}
          markers={markers}
          fitMarkers={markers.length > 1}
        />

        <div className="mt-2 space-y-1">
          {gpsLoading && !position && (
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Getting your GPS…
            </p>
          )}
          {gpsError && (
            <p className="text-xs text-rose-600 font-medium">{gpsError}</p>
          )}
          {position && (
            <div className="flex items-start gap-1.5 text-xs text-gray-600">
              <MapPin className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
              <span className="leading-snug">
                {address || `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`}
                <span className="block text-[10px] text-gray-400 font-mono mt-0.5">
                  {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                  {position.accuracy != null && ` · ±${Math.round(position.accuracy)}m`}
                </span>
              </span>
            </div>
          )}
          {dropAddress && (
            <p className="text-[11px] text-gray-500 pl-5">
              Drop: <span className="font-medium text-gray-700">{dropAddress}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveDeliveryTracker;
