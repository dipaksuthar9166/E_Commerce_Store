import React, { useState, useEffect } from 'react';
import {
  MapPin, Navigation, CheckCircle, Clock,
  Bike, IndianRupee, Package,
  AlertCircle, Phone, Loader2
} from 'lucide-react';
import api from '../../api/axios';
import { useSocket } from '../../contexts/SocketContext';
import { useOutletContext } from 'react-router-dom';
import LiveDeliveryTracker from './LiveDeliveryTracker';
import GoogleMapView from '../../components/maps/GoogleMapView';
import { useWatchPosition } from '../../hooks/useWatchPosition';
import { googleDirectionsUrl } from '../../utils/googleMaps';

// ── Stat Card ─────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className={`flex-1 flex flex-col items-center gap-1 py-3 px-1 rounded-2xl ${color}`}>
    <Icon className="w-4 h-4 opacity-80" />
    <p className="text-[10px] font-medium opacity-75 text-center leading-tight">{label}</p>
    <p className="text-sm font-extrabold">{value}</p>
  </div>
);

// ── Task Card ─────────────────────────────────────────────
const TaskCard = ({ task, onAccept, onDecline }) => (
  <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
    <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 flex items-center justify-between">
      <span className="text-white text-[10px] font-extrabold tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
        NEW ORDER
      </span>
      <span className="text-white font-extrabold text-base">₹{task.earning}</span>
    </div>

    <div className="p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Package className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pick Up</p>
          <p className="font-bold text-gray-900 text-sm">{task.shop}</p>
          <p className="text-xs text-gray-500">{task.shopAddress}</p>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-1">
            <MapPin className="w-3 h-3" /> {task.distance}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-8 flex justify-center">
          <div className="w-0.5 h-6 border-l-2 border-dashed border-gray-300" />
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <MapPin className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Deliver To</p>
          <p className="font-bold text-gray-900 text-sm">{task.customer}</p>
          <p className="text-xs text-gray-500">{task.deliveryAddress}</p>
        </div>
      </div>

      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
        <span className="text-xs text-gray-500 font-medium">Your Earning</span>
        <span className="text-green-600 font-extrabold text-sm">+₹{task.earning}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={() => onDecline(task._id)}
          className="py-2.5 rounded-xl border-2 border-red-500 text-red-500 text-sm font-bold hover:bg-red-50 active:scale-95 transition-all duration-150"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => onAccept(task._id)}
          className="py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold shadow-md shadow-green-200 hover:shadow-green-300 active:scale-95 transition-all duration-150 flex items-center justify-center gap-1"
        >
          <CheckCircle className="w-4 h-4" /> Accept
        </button>
      </div>
    </div>
  </div>
);

// ── Active Delivery Card ───────────────────────────────────
const ActiveDeliveryCard = ({ task, onDeliver, riderPos }) => {
  const [otp, setOtp] = useState('');
  const navHref = googleDirectionsUrl(task.deliveryAddress, riderPos);

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl shadow-xl p-4 space-y-4 animate-in zoom-in duration-300">
      <div className="flex items-center justify-between">
        <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-full">
          🚴 Active Delivery
        </span>
        <span className="text-white font-extrabold text-base">₹{task.earning}</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3 text-white">
          <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Package className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-white/60 text-[10px] font-bold uppercase">Pickup</p>
            <p className="font-bold text-sm">{task.shop} • {task.distance}</p>
            {task.shopAddress && (
              <p className="text-white/70 text-xs">{task.shopAddress}</p>
            )}
          </div>
        </div>
        <div className="ml-3.5 w-0.5 h-4 border-l-2 border-dashed border-white/30" />
        <div className="flex items-center gap-3 text-white">
          <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-white/60 text-[10px] font-bold uppercase">Drop</p>
            <p className="font-bold text-sm">{task.customer}</p>
            <p className="text-white/70 text-xs">{task.deliveryAddress}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Enter Delivery OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full py-2.5 px-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 text-center tracking-widest text-lg font-bold"
        />
        <div className="flex gap-2">
          <a
            href={navHref}
            target="_blank"
            rel="noreferrer"
            className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-white/30 transition-colors"
            title="Google Maps directions"
          >
            <Navigation className="w-5 h-5 text-white" />
          </a>
          <a
            href={`tel:${task.phone}`}
            className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-white/30 transition-colors"
            title="Call Customer"
          >
            <Phone className="w-5 h-5 text-white" />
          </a>
          <button
            type="button"
            onClick={() => onDeliver(task._id, otp)}
            className="flex-1 py-3 bg-green-400 hover:bg-green-300 text-green-900 font-extrabold rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-green-900/30 active:scale-95 transition-all duration-150"
          >
            <CheckCircle className="w-5 h-5" /> Verify & Complete Delivery
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────
const DeliveryDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [stats, setStats] = useState({ deliveriesDone: 0, earnings: 0, distanceCovered: '0.0' });
  const [loading, setLoading] = useState(true);

  const { socket } = useSocket();
  const outlet = useOutletContext() || {};
  const isOnline = outlet.isOnline !== false;

  // Always track GPS when online (map + active delivery broadcast)
  const { position: riderPos, error: gpsError, loading: gpsLoading } = useWatchPosition(isOnline);

  useEffect(() => {
    fetchRiderData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleTaskAvailable = (formattedTask) => {
      setTasks((prev) => [formattedTask, ...prev]);
    };

    const handleTaskTaken = (takenId) => {
      setTasks((prev) => prev.filter((t) => String(t._id) !== String(takenId)));
    };

    socket.on('taskAvailable', handleTaskAvailable);
    socket.on('taskTaken', handleTaskTaken);

    return () => {
      socket.off('taskAvailable', handleTaskAvailable);
      socket.off('taskTaken', handleTaskTaken);
    };
  }, [socket]);

  // Re-fetch when coming back online
  useEffect(() => {
    if (isOnline) fetchRiderData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const fetchRiderData = async () => {
    try {
      const [tasksRes, statsRes] = await Promise.all([
        api.get('/delivery/tasks'),
        api.get('/delivery/stats'),
      ]);
      setTasks(tasksRes.data);

      const { deliveriesDone, earnings, distanceCovered, history } = statsRes.data;
      setStats({ deliveriesDone, earnings, distanceCovered });

      const activeOrder = history.find((o) => o.status === 'out_for_delivery');
      if (activeOrder) {
        setActiveDelivery({
          _id: activeOrder._id,
          shop: activeOrder.shop,
          shopAddress: activeOrder.shopAddress || 'Shop',
          distance: activeOrder.distance || '—',
          deliveryAddress: activeOrder.deliveryAddress || 'Customer Address',
          customer: activeOrder.customer,
          phone: activeOrder.phone || '+91 99999 99999',
          earning: activeOrder.earning || 40,
        });
      } else {
        setActiveDelivery(null);
      }
    } catch (error) {
      console.error('Error fetching delivery boy data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      const { data } = await api.put(`/delivery/orders/${id}/accept`);
      setActiveDelivery(data);
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (error) {
      console.error('Failed to accept task', error);
      alert('Task has already been taken by another rider.');
    }
  };

  const handleDecline = (id) => {
    setTasks((prev) => prev.filter((t) => t._id !== id));
  };

  const handleDeliver = async (id, otp) => {
    try {
      if (!otp) return alert('Please enter delivery OTP.');
      await api.post(`/orders/${id}/verify-delivery`, { otp });
      setActiveDelivery(null);
      fetchRiderData();
    } catch (error) {
      console.error('Failed to deliver task', error);
      alert(error.response?.data?.message || 'Failed to verify delivery');
    }
  };

  const idleMapMarkers = riderPos
    ? [{ id: 'me', lat: riderPos.lat, lng: riderPos.lng, title: 'You', color: 'purple' }]
    : [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Connecting to Rider Portal...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-full">
      {/* ── Today's Stats Bar ─────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 pt-1 pb-5">
        <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-3">Today&apos;s Summary</p>
        <div className="flex gap-2">
          <StatCard icon={CheckCircle} label="Deliveries Done" value={stats.deliveriesDone} color="bg-white/15 text-white" />
          <StatCard icon={IndianRupee} label="Today's Earnings" value={`₹${stats.earnings}`} color="bg-white/15 text-white" />
          <StatCard icon={Bike} label="Distance Covered" value={`${stats.distanceCovered} km`} color="bg-white/15 text-white" />
        </div>
      </div>

      <div className="px-4 -mt-2 space-y-4 pb-4">
        {/* ── Active Delivery ───────────────────────── */}
        {activeDelivery && (
          <ActiveDeliveryCard
            task={activeDelivery}
            onDeliver={handleDeliver}
            riderPos={riderPos}
          />
        )}

        {/* ── Google Map (live GPS or active delivery tracker) ── */}
        {activeDelivery ? (
          <LiveDeliveryTracker
            orderId={activeDelivery._id}
            dropAddress={activeDelivery.deliveryAddress}
            shopAddress={activeDelivery.shopAddress}
            enabled={isOnline}
          />
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="px-3 py-2 flex items-center justify-between border-b border-gray-50">
              <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                Your location
              </p>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {isOnline ? (gpsLoading ? 'Locating…' : 'LIVE') : 'OFFLINE'}
              </span>
            </div>
            <div className="p-2">
              {isOnline ? (
                <GoogleMapView
                  height={180}
                  zoom={16}
                  center={riderPos}
                  markers={idleMapMarkers}
                  fitMarkers={false}
                />
              ) : (
                <div className="h-[180px] flex items-center justify-center bg-gray-100 rounded-xl text-xs text-gray-500 font-medium">
                  Go ONLINE to show live map
                </div>
              )}
              {gpsError && isOnline && (
                <p className="text-[11px] text-rose-600 px-1 pt-1.5">{gpsError}</p>
              )}
            </div>
          </div>
        )}

        {/* ── Available Tasks Header ────────────────── */}
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-gray-900 text-base">Available Tasks</h2>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="text-[10px] font-extrabold text-green-600 uppercase tracking-widest">LIVE</span>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-400">
            <AlertCircle className="w-10 h-10" />
            <p className="font-semibold text-sm">No new tasks right now</p>
            <p className="text-xs text-center text-gray-400 leading-tight">
              Stay online. New accepted vendor orders will flash here in real-time!
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onAccept={handleAccept}
              onDecline={handleDecline}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default DeliveryDashboard;
