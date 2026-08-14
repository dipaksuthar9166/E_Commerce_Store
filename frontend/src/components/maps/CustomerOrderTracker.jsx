import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Bike, Loader2, Phone } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import LeafletMapView from './LeafletMapView';
import api from '../../api/axios';

// A simple fallback geocoding function since we don't have Google Maps
// Ideally this would be real geocoding, but for now we just use a default fallback
const mockGeocode = async (address) => {
  // If it's a known string, return fixed coords, otherwise random offset from a center
  // Jaipur center approx
  return {
    lat: 26.9124 + (Math.random() - 0.5) * 0.05,
    lng: 75.7873 + (Math.random() - 0.5) * 0.05
  };
};

/**
 * Customer-facing live map for an out_for_delivery order.
 * Loads last known GPS from API, then listens on socket room order_track_{orderId}.
 */
export default function CustomerOrderTracker({ orderId, deliveryAddress, shopAddress }) {
  const { socket, connected } = useSocket();
  const [rider, setRider] = useState(null);
  const [drop, setDrop] = useState(null);
  const [shop, setShop] = useState(null);
  const [lastAt, setLastAt] = useState(null);
  const [riderInfo, setRiderInfo] = useState(null);
  const [bootLoading, setBootLoading] = useState(true);

  const loadTracking = useCallback(async (silent = false) => {
    if (!orderId) return;
    if (!silent) setBootLoading(true);
    try {
      const { data } = await api.get(`/orders/${orderId}/tracking`);
      if (data?.location?.lat != null && data?.location?.lng != null) {
        setRider({ lat: data.location.lat, lng: data.location.lng });
        setLastAt(data.location.lastUpdated || null);
      }
      if (data?.rider) setRiderInfo(data.rider);
    } catch (err) {
      console.warn('Tracking bootstrap failed', err?.response?.data || err.message);
    } finally {
      if (!silent) setBootLoading(false);
    }
  }, [orderId]);

  // Bootstrap + periodic poll so map moves even if socket drops
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await loadTracking(false);
    })();

    const t = setInterval(() => {
      if (!cancelled) loadTracking(true);
    }, connected ? 4000 : 2500);

    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [loadTracking, connected]);

  // Live socket updates + rejoin room on reconnect
  useEffect(() => {
    if (!socket || !orderId) return;
    const id = String(orderId);

    const join = () => socket.emit('joinOrderTrack', id);
    join();

    const onLoc = (payload) => {
      if (!payload) return;
      if (payload.orderId && String(payload.orderId) !== id) return;
      if (payload.lat == null || payload.lng == null) return;
      setRider({ lat: Number(payload.lat), lng: Number(payload.lng) });
      setLastAt(payload.at || new Date().toISOString());
    };

    socket.on('deliveryLocationUpdated', onLoc);
    socket.on('connect', join);
    socket.on('reconnect', join);

    return () => {
      socket.emit('leaveOrderTrack', id);
      socket.off('deliveryLocationUpdated', onLoc);
      socket.off('connect', join);
      socket.off('reconnect', join);
    };
  }, [socket, orderId, connected]);

  // Geocode drop / shop for map pins using our mock since Google Maps is removed
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (deliveryAddress && !drop) {
        try {
          const c = await mockGeocode(deliveryAddress);
          if (!cancelled) setDrop({ lat: c.lat, lng: c.lng });
        } catch { /* ignore */ }
      }
      if (shopAddress && !shop) {
        try {
          const c = await mockGeocode(shopAddress);
          if (!cancelled) setShop({ lat: c.lat, lng: c.lng });
        } catch { /* ignore */ }
      }
    })();
    return () => { cancelled = true; };
  }, [deliveryAddress, shopAddress, drop, shop]);

  const markers = useMemo(() => {
    const list = [];
    if (shop) list.push({ id: 'shop', ...shop, title: 'Shop pickup', color: 'blue' });
    if (drop) list.push({ id: 'drop', ...drop, title: 'Your address', color: 'green' });
    if (rider) list.push({ id: 'rider', ...rider, title: 'Delivery partner', color: 'purple' });
    return list;
  }, [shop, rider, drop]);

  return (
    <div className="mt-4 rounded-2xl border border-purple-100 bg-purple-50/40 overflow-hidden shadow-sm">
      <div className="px-3 py-2 flex items-center justify-between gap-2 border-b border-purple-100/80 bg-white">
        <p className="text-xs font-bold text-purple-800 flex items-center gap-1.5">
          <Bike className="w-3.5 h-3.5" /> Live delivery map
          {connected ? (
            <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-400" title="Live" />
          ) : (
            <span className="ml-1 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400" title="Reconnecting…" />
          )}
        </p>
        <span className="text-[10px] font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
          {rider ? (
            lastAt ? `Updated ${new Date(lastAt).toLocaleTimeString()}` : 'Live'
          ) : bootLoading ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading…
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Waiting for rider GPS…
            </span>
          )}
        </span>
      </div>

      {riderInfo?.name && (
        <div className="px-3 py-2 flex items-center justify-between text-[11px] text-purple-900 border-b border-purple-100/60 bg-purple-50/30">
          <span className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center font-bold text-purple-700">
              {riderInfo.name.charAt(0)}
            </div>
            <span>
              Rider: <strong>{riderInfo.name}</strong>
            </span>
          </span>
          {riderInfo.phone && (
            <a
              href={`tel:${riderInfo.phone}`}
              className="inline-flex items-center gap-1 font-bold text-purple-700 hover:text-purple-800 hover:underline bg-purple-100 px-2 py-1 rounded-md"
            >
              <Phone className="w-3 h-3" /> Call
            </a>
          )}
        </div>
      )}

      <div className="p-0 border-t border-purple-100">
        <LeafletMapView
          height={220}
          zoom={14}
          markers={markers}
          center={rider || drop || shop}
          fitMarkers={markers.length > 1}
        />
      </div>
    </div>
  );
}
