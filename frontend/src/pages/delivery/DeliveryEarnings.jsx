import React, { useState, useEffect } from 'react';
import {
  IndianRupee, TrendingUp, CalendarDays, ArrowRight,
  CheckCircle2, Clock, XCircle, Bike, Loader2
} from 'lucide-react';
import api from '../../api/axios';

// ── Status Badge ──────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    delivered: { label: 'Delivered', cls: 'bg-green-100 text-green-700', Icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-600',   Icon: XCircle },
    out_for_delivery: { label: 'On Way', cls: 'bg-indigo-100 text-indigo-600', Icon: Bike },
    pending:   { label: 'Pending',   cls: 'bg-amber-100 text-amber-600', Icon: Clock },
  };
  const { label, cls, Icon } = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
};

// ── Stat Pill ─────────────────────────────────────────────
const StatPill = ({ icon: Icon, label, value, gradient, shadow }) => (
  <div className={`flex flex-col gap-1 p-3 rounded-2xl ${gradient} ${shadow}`}>
    <div className="flex items-center gap-1.5">
      <Icon className="w-4 h-4 text-white/80" />
      <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">{label}</p>
    </div>
    <p className="text-white font-extrabold text-lg leading-tight">{value}</p>
  </div>
);

// ── History Card ──────────────────────────────────────────
const HistoryCard = ({ item }) => {
  const dateStr = new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
    ' ' + new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">#{item._id?.slice(-6).toUpperCase()}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <CalendarDays className="w-3 h-3 text-gray-400" />
            <p className="text-xs text-gray-500">{dateStr}</p>
          </div>
        </div>
        <StatusBadge status={item.status} />
      </div>

      {/* Route */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center gap-1">
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          </div>
          <div className="w-0.5 h-3 border-l border-dashed border-gray-300" />
          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">From</p>
            <p className="text-sm font-bold text-gray-800">{item.shop}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">To — {item.customer}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-2">
        <div className="flex items-center gap-1.5 text-gray-400 text-xs">
          <Bike className="w-3.5 h-3.5" />
          <span>2.5 km</span>
        </div>
        <span className={`font-extrabold text-base ${item.earning > 0 ? 'text-green-600' : 'text-gray-400'}`}>
          {item.earning > 0 ? `+₹${item.earning}` : '—'}
        </span>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────
const DeliveryEarnings = () => {
  const [stats, setStats] = useState({ deliveriesDone: 0, earnings: 0, distanceCovered: '0.0' });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/delivery/stats');
      setStats({
        deliveriesDone: data.deliveriesDone,
        earnings: data.earnings,
        distanceCovered: data.distanceCovered
      });
      setHistory(data.history || []);
    } catch (error) {
      console.error('Error fetching rider statistics', error);
    } finally {
      setLoading(false);
    }
  };

  const WEEKLY_DATA = [
    { day: 'Mon', amount: 0 },
    { day: 'Tue', amount: 0 },
    { day: 'Wed', amount: 0 },
    { day: 'Thu', amount: 0 },
    { day: 'Fri', amount: 0 },
    { day: 'Sat', amount: 0 },
    { day: 'Sun', amount: stats.earnings }, // bind actual earnings to current day
  ];
  const maxAmount = Math.max(...WEEKLY_DATA.map(d => d.amount)) || 40;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Loading statistics...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-full">

      {/* ── Header Banner ────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 pt-1 pb-8">
        <p className="text-white font-extrabold text-xl mb-1">My Earnings 💰</p>
        <p className="text-white/70 text-xs">Track your daily & weekly income</p>
      </div>

      <div className="px-4 -mt-4 space-y-4 pb-6">

        {/* ── Stats Grid ───────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          <StatPill
            icon={IndianRupee}
            label="Today"
            value={`₹${stats.earnings}`}
            gradient="bg-gradient-to-br from-green-500 to-emerald-600"
            shadow="shadow-md shadow-green-200"
          />
          <StatPill
            icon={TrendingUp}
            label="This Week"
            value={`₹${stats.earnings}`}
            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
            shadow="shadow-md shadow-blue-200"
          />
          <StatPill
            icon={CalendarDays}
            label="Distance"
            value={`${stats.distanceCovered} km`}
            gradient="bg-gradient-to-br from-purple-500 to-violet-600"
            shadow="shadow-md shadow-purple-200"
          />
        </div>

        {/* ── Weekly Bar Chart ─────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="font-bold text-gray-800 text-sm mb-4">This Week</p>
          <div className="flex items-end justify-between gap-1.5 h-24">
            {WEEKLY_DATA.map(({ day, amount }) => {
              const heightPct = amount > 0 ? Math.round((amount / maxAmount) * 100) : 0;
              const isToday = day === 'Sun';
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <span className={`text-[9px] font-bold ${isToday ? 'text-indigo-600' : 'text-gray-500'}`}>
                    ₹{amount}
                  </span>
                  <div className="w-full flex items-end" style={{ height: '60px' }}>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isToday && amount > 0
                          ? 'bg-gradient-to-t from-indigo-600 to-blue-400'
                          : 'bg-gradient-to-t from-gray-300 to-gray-200'
                      }`}
                      style={{ height: `${heightPct || 5}%` }}
                    />
                  </div>
                  <span className={`text-[9px] font-bold ${isToday ? 'text-indigo-600' : 'text-gray-400'}`}>{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Delivery History ─────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-gray-900 text-base">Delivery History</h2>
            <button className="flex items-center gap-0.5 text-indigo-600 text-xs font-bold hover:text-indigo-700">
              See all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {history.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm font-medium">
              No delivery history yet. Accept a task to start earning!
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(item => (
                <HistoryCard key={item._id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryEarnings;
