import React, { useState, useEffect } from 'react';
import {
  Store,
  CheckCircle,
  XCircle,
  ShieldOff,
  MapPin,
  Package,
  Loader2,
  Trash2,
} from 'lucide-react';
import api from '../../api/axios';
import {
  PageShell,
  PageHeader,
  RefreshButton,
  StatCard,
  SurfaceCard,
  CardHeader,
  SearchField,
  SoftBadge,
  StatusBadge,
  PillTabs,
  DataTable,
  TableHead,
  Th,
  TableBody,
  Tr,
  TableEmpty,
  TableSkeleton,
  TableFooter,
  tdClass,
} from '../../components/ui/PageUI';

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

  useEffect(() => {
    fetchShops();
  }, []);

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

  const handleDeleteShop = async (shopId) => {
    if (
      !window.confirm(
        'Are you sure you want to permanently delete this shop and all its products? This action cannot be undone.'
      )
    ) {
      return;
    }
    setActionLoading((prev) => ({ ...prev, [shopId]: true }));
    try {
      await api.delete(`/admin/shops/${shopId}`);
      setShops((prev) => prev.filter((s) => s._id !== shopId));
    } catch (err) {
      console.error('Failed to delete shop', err);
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
    Total: enrichedShops.length,
    All: enrichedShops.length,
    Active: enrichedShops.filter((s) => s.status === 'Active').length,
    Pending: enrichedShops.filter((s) => s.status === 'Pending').length,
    Blocked: 0,
  };

  return (
    <PageShell>
      <PageHeader
        title="Manage Shops"
        subtitle="Review, approve and control all shops on the platform."
        actions={<RefreshButton onClick={fetchShops} loading={loading} />}
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Shops"
          value={loading ? '—' : counts.Total}
          subtitle="Registered shops"
          icon={Store}
          iconColor="bg-indigo-50 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-400"
          bar="from-pink-400 via-fuchsia-400 to-violet-500"
          delay={0}
        />
        <StatCard
          title="Active"
          value={loading ? '—' : counts.Active}
          subtitle="Live on marketplace"
          icon={CheckCircle}
          iconColor="bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400"
          bar="from-emerald-400 via-teal-400 to-cyan-500"
          delay={0.05}
        />
        <StatCard
          title="Pending / Inactive"
          value={loading ? '—' : counts.Pending}
          subtitle="Awaiting approval"
          icon={Package}
          iconColor="bg-amber-50 text-amber-500 dark:bg-amber-500/15 dark:text-amber-400"
          bar="from-amber-400 via-orange-400 to-rose-400"
          delay={0.1}
        />
        <StatCard
          title="Blocked"
          value={loading ? '—' : counts.Blocked}
          subtitle="Not currently tracked"
          icon={ShieldOff}
          iconColor="bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-400"
          bar="from-rose-400 via-pink-400 to-orange-400"
          delay={0.15}
        />
      </div>

      <SurfaceCard delay={0.12}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <PillTabs tabs={tabs} value={activeTab} onChange={setActiveTab} counts={counts} />
          <SearchField
            className="w-full sm:w-64"
            placeholder="Search shops or vendors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </SurfaceCard>

      <SurfaceCard padding={false} delay={0.18}>
        <CardHeader
          title="Shops Directory"
          subtitle={`${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
        />

        <DataTable minWidth="1000px">
          <TableHead>
            {['Shop Name', 'Vendor', 'Address', 'Category', 'Status', 'Products', 'Joined', 'Actions'].map(
              (h) => (
                <Th key={h}>{h}</Th>
              )
            )}
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeleton rows={5} colSpan={8} />
            ) : filtered.length === 0 ? (
              <TableEmpty
                icon={Store}
                title="No shops found."
                subtitle="Try a different tab or search term."
                colSpan={8}
              />
            ) : (
              filtered.map((shop) => (
                <Tr key={shop._id}>
                  <td className={tdClass}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
                        <Store size={15} />
                      </div>
                      <p className="text-slate-800 dark:text-slate-100 font-semibold text-xs">
                        {shop.shopName}
                      </p>
                    </div>
                  </td>
                  <td className={tdClass}>
                    <p className="text-slate-700 dark:text-slate-300 text-xs">{shop.vendor}</p>
                    <p className="text-slate-400 dark:text-slate-500 text-[10px]">{shop.email}</p>
                  </td>
                  <td className={tdClass}>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs max-w-[160px]">
                      <MapPin size={12} className="text-slate-300 dark:text-slate-600 shrink-0" />
                      <span className="truncate">{shop.address}</span>
                    </div>
                  </td>
                  <td className={`${tdClass} text-slate-500 dark:text-slate-400 text-xs`}>
                    {shop.shopCategory || 'Other'}
                  </td>
                  <td className={tdClass}>
                    <StatusBadge
                      active={!!shop.isActive}
                      activeLabel="Active"
                      inactiveLabel="Inactive"
                    />
                  </td>
                  <td className={tdClass}>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                      <Package size={12} className="text-slate-300 dark:text-slate-600 shrink-0" />
                      {shop.productCount}
                    </div>
                  </td>
                  <td className={`${tdClass} text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap`}>
                    {new Date(shop.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className={tdClass}>
                    <div className="flex items-center gap-1.5">
                      {actionLoading[shop._id] ? (
                        <Loader2
                          size={16}
                          className="animate-spin text-slate-400 dark:text-slate-500"
                        />
                      ) : shop.isActive ? (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(shop._id, false)}
                          title="Deactivate"
                          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-rose-500 dark:bg-slate-800 dark:hover:bg-rose-600 text-slate-600 hover:text-white dark:text-slate-300 text-[11px] font-bold transition-colors"
                        >
                          <ShieldOff size={12} /> Deactivate
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(shop._id, true)}
                            title="Approve"
                            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition-colors"
                          >
                            <CheckCircle size={12} /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(shop._id, false)}
                            title="Keep Inactive"
                            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500 text-white text-[11px] font-bold shadow-sm transition-colors"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteShop(shop._id)}
                        title="Delete Shop"
                        className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-500 dark:bg-rose-950/50 dark:hover:bg-rose-600 text-rose-600 hover:text-white dark:text-rose-400 text-[11px] font-bold transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </Tr>
              ))
            )}
          </TableBody>
        </DataTable>

        {!loading && (
          <TableFooter>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {filtered.length}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {enrichedShops.length}
              </span>{' '}
              shops
            </p>
          </TableFooter>
        )}
      </SurfaceCard>
    </PageShell>
  );
};

export default AdminShops;
