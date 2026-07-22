import React, { useState, useEffect } from 'react';
import {
  Store,
  Search,
  CheckCircle,
  XCircle,
  ShieldOff,
  ShieldCheck,
  MapPin,
  Package,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import api from '../../api/axios';

const tabs = ['All', 'Active', 'Pending', 'Blocked'];

// isActive: true  → Active
// isActive: false → Pending (new shops are inactive by default until approved)
// We add a separate "blocked" concept via the same isActive=false but track it with a flag
// Backend's updateShopStatus sets isActive explicitly. We differentiate:
//   - Never approved (createdAt recent, isActive:false) → Pending
//   - Manually blocked (isActive:false, was active before) → Blocked
// Since the DB doesn't store a "blocked" reason, we map:
//   isActive: true  → Active
//   isActive: false → shown as Pending (they need approval or were blocked)

const getStatus = (shop) => {
  if (shop.isActive) return 'Active';
  return 'Pending'; // covers both "never approved" and "blocked" cases
};

const statusConfig = {
  Active:  { label: 'Active',  cls: 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/40' },
  Pending: { label: 'Inactive', cls: 'bg-yellow-900/50 text-yellow-400 border border-yellow-700/40' },
  Blocked: { label: 'Blocked', cls: 'bg-red-900/50 text-red-400 border border-red-700/40' },
};

const AdminShops = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');

  const fetchShops = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/shops');
      setShops(data);
    } catch (err) {
      console.error('Failed to load shops', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShops(); }, []);

  const handleStatusChange = async (shopId, makeActive) => {
    setActionLoading((prev) => ({ ...prev, [shopId]: true }));
    try {
      const { data } = await api.put(`/admin/shops/${shopId}/status`, { isActive: makeActive });
      setShops((prev) =>
        prev.map((s) => (s._id === shopId ? { ...s, isActive: data.shop.isActive } : s))
      );
    } catch (err) {
      console.error('Failed to update shop status', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [shopId]: false }));
    }
  };

  const enrichedShops = shops.map((s) => ({ ...s, status: s.isActive ? 'Active' : 'Pending' }));

  const filtered = enrichedShops.filter((s) => {
    const matchTab = activeTab === 'All' || s.status === activeTab;
    const term = search.toLowerCase();
    const matchSearch =
      s.shopName?.toLowerCase().includes(term) ||
      s.vendor?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term);
    return matchTab && matchSearch;
  });

  const counts = {
    Total:   enrichedShops.length,
    Active:  enrichedShops.filter((s) => s.status === 'Active').length,
    Pending: enrichedShops.filter((s) => s.status === 'Pending').length,
    Blocked: 0,
  };

  return (
    <div className="space-y-7">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Manage Shops</h1>
          <p className="text-slate-400 text-sm mt-1">Review, approve and control all shops on the platform.</p>
        </div>
        <button
          onClick={fetchShops}
          className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Shops',      value: counts.Total,   color: 'text-white',       bg: 'bg-slate-800 border-slate-700' },
          { label: 'Active',           value: counts.Active,  color: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-800/50' },
          { label: 'Pending / Inactive', value: counts.Pending, color: 'text-yellow-400', bg: 'bg-yellow-950/60 border-yellow-800/50' },
          { label: 'Blocked',          value: counts.Blocked, color: 'text-red-400',     bg: 'bg-red-950/60 border-red-800/50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} border rounded-2xl p-5`}>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">{label}</p>
            <p className={`${color} text-4xl font-black mt-2`}>{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters & Search ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-b border-slate-800">
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-800 p-1 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
                {tab !== 'All' && (
                  <span className="ml-1.5 opacity-70">({counts[tab] ?? 0})</span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search shops or vendors…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm pl-9 pr-4 py-2 rounded-xl placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Shop Name', 'Vendor', 'Address', 'Category', 'Status', 'Products', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-6 py-4">
                      <div className="animate-pulse h-8 bg-slate-800 rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center text-slate-500">
                    <Store size={36} className="mx-auto mb-3 opacity-30" />
                    No shops found.
                  </td>
                </tr>
              ) : (
                filtered.map((shop) => (
                  <tr key={shop._id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Shop Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-700 rounded-xl flex items-center justify-center shrink-0">
                          <Store size={15} className="text-slate-400" />
                        </div>
                        <p className="text-white font-semibold text-xs">{shop.shopName}</p>
                      </div>
                    </td>
                    {/* Vendor */}
                    <td className="px-6 py-4">
                      <p className="text-slate-300 text-xs">{shop.vendor}</p>
                      <p className="text-slate-500 text-[10px]">{shop.email}</p>
                    </td>
                    {/* Address */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs max-w-[160px]">
                        <MapPin size={12} className="text-slate-600 shrink-0" />
                        <span className="truncate">{shop.address}</span>
                      </div>
                    </td>
                    {/* Category */}
                    <td className="px-6 py-4 text-slate-400 text-xs">{shop.shopCategory || 'Other'}</td>
                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusConfig[shop.status]?.cls || statusConfig.Pending.cls}`}>
                        {shop.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {/* Products */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <Package size={12} className="text-slate-600 shrink-0" />
                        {shop.productCount}
                      </div>
                    </td>
                    {/* Joined */}
                    <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(shop.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {actionLoading[shop._id] ? (
                          <Loader2 size={16} className="animate-spin text-slate-400" />
                        ) : shop.isActive ? (
                          <button
                            onClick={() => handleStatusChange(shop._id, false)}
                            title="Deactivate"
                            className="flex items-center gap-1 bg-slate-700 hover:bg-red-700 text-slate-300 hover:text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <ShieldOff size={12} /> Deactivate
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStatusChange(shop._id, true)}
                              title="Approve"
                              className="flex items-center gap-1 bg-emerald-600/80 hover:bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              <CheckCircle size={12} /> Approve
                            </button>
                            <button
                              onClick={() => handleStatusChange(shop._id, false)}
                              title="Keep Inactive"
                              className="flex items-center gap-1 bg-red-600/60 hover:bg-red-600 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              <XCircle size={12} /> Reject
                            </button>
                          </>
                        )}
                        {shop.isActive && (
                          <button
                            onClick={() => handleStatusChange(shop._id, true)}
                            title="Already Active"
                            className="flex items-center gap-1 bg-slate-700 hover:bg-emerald-700 text-slate-300 hover:text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <ShieldCheck size={12} /> Active
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && (
          <div className="px-6 py-3 border-t border-slate-800">
            <p className="text-slate-500 text-xs">
              Showing <span className="text-slate-300 font-semibold">{filtered.length}</span> of{' '}
              <span className="text-slate-300 font-semibold">{enrichedShops.length}</span> shops
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminShops;
