import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Loader2,
  ShoppingBag,
  IndianRupee,
  Mail,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import {
  PageShell,
  PageHeader,
  RefreshButton,
  StatCard,
  SurfaceCard,
  CardHeader,
  fieldClass,
  labelClass,
  DataTable,
  TableHead,
  Th,
  TableBody,
  TableEmpty,
  TableSkeleton,
  tdClass,
  SoftBadge,
  AlertBanner,
} from '../../components/ui/PageUI';

const VendorCustomers = () => {
  const [orders, setOrders] = useState([]);
  const [blockedCustomerIds, setBlockedCustomerIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [blocking, setBlocking] = useState({});

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data: ordersData } = await api.get('/vendor/orders');
      setOrders(ordersData?.orders || []);
      setBlockedCustomerIds(new Set(ordersData?.blockedCustomerIds || []));
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const customers = useMemo(() => {
    const map = new Map();
    orders.forEach((order) => {
      const user = order.userId;
      if (!user?._id) return;

      const key = user._id;
      const name = user?.name || 'Customer';
      const email = user?.email || '—';
      const amount = order.totalAmount || 0;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          id: key,
          name,
          email,
          orderCount: 1,
          totalSpent: amount,
          lastOrderAt: order.createdAt,
          statuses: { [order.status]: 1 },
        });
      } else {
        existing.orderCount += 1;
        existing.totalSpent += amount;
        existing.statuses[order.status] = (existing.statuses[order.status] || 0) + 1;
        if (new Date(order.createdAt) > new Date(existing.lastOrderAt || 0)) {
          existing.lastOrderAt = order.createdAt;
          existing.name = name;
          existing.email = email;
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const visibleCustomers = useMemo(
    () => customers.filter((c) => !blockedCustomerIds.has(c.id)),
    [customers, blockedCustomerIds]
  );

  const handleDeleteCustomer = async (customerId) => {
    if (
      !window.confirm(
        'Are you sure you want to block this customer? They will not be able to order from your shop.'
      )
    ) {
      return;
    }

    setBlocking((prev) => ({ ...prev, [customerId]: true }));
    try {
      setBlockedCustomerIds((prev) => new Set(prev).add(customerId));
      await api.put(`/vendor/customers/${customerId}/block`);
    } catch (err) {
      console.error('Failed to block customer', err);
      setBlockedCustomerIds((prev) => {
        const next = new Set(prev);
        next.delete(customerId);
        return next;
      });
    } finally {
      setBlocking((prev) => ({ ...prev, [customerId]: false }));
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return visibleCustomers;
    return visibleCustomers.filter(
      (c) => c.name.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term)
    );
  }, [visibleCustomers, search]);

  const totals = useMemo(
    () => ({
      count: visibleCustomers.length,
      orders: orders.length,
      revenue: visibleCustomers.reduce((s, c) => s + c.totalSpent, 0),
      blocked: blockedCustomerIds.size,
    }),
    [visibleCustomers, orders, blockedCustomerIds]
  );

  return (
    <PageShell>
      <PageHeader
        title="Customers"
        subtitle="Buyers who ordered from your shop — built from real order history."
        actions={<RefreshButton onClick={fetchCustomers} loading={loading} />}
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Unique Customers"
          value={loading ? '—' : totals.count}
          subtitle="Active buyers"
          icon={Users}
          iconColor="bg-indigo-50 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-400"
          bar="from-indigo-400 via-violet-400 to-fuchsia-500"
          delay={0}
        />
        <StatCard
          title="Total Orders"
          value={loading ? '—' : totals.orders}
          subtitle="All time"
          icon={ShoppingBag}
          iconColor="bg-orange-50 text-orange-500 dark:bg-orange-500/15 dark:text-orange-400"
          bar="from-orange-400 via-amber-400 to-yellow-400"
          delay={0.05}
        />
        <StatCard
          title="Gross Revenue"
          value={loading ? '—' : `₹${totals.revenue.toLocaleString('en-IN')}`}
          subtitle="From customers"
          icon={IndianRupee}
          iconColor="bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400"
          bar="from-emerald-400 via-teal-400 to-cyan-400"
          delay={0.1}
        />
        <StatCard
          title="Blocked"
          value={loading ? '—' : totals.blocked}
          subtitle="Cannot order"
          icon={UserCheck}
          iconColor="bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-400"
          bar="from-rose-400 via-pink-400 to-fuchsia-400"
          delay={0.15}
        />
      </div>

      {totals.blocked > 0 && (
        <AlertBanner icon={Trash2} title="Blocked customers" tone="rose">
          {totals.blocked} customer{totals.blocked > 1 ? 's are' : ' is'} blocked from ordering at
          your shop.
        </AlertBanner>
      )}

      <SurfaceCard delay={0.12}>
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 min-w-0">
            <label className={labelClass}>Search Customers</label>
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className={`${fieldClass} pl-10 pr-4`}
              />
            </div>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard padding={false} delay={0.18}>
        <CardHeader
          title="Customer Directory"
          subtitle={`${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
        />

        <DataTable minWidth="700px">
          <TableHead>
            <Th>Customer</Th>
            <Th>Orders</Th>
            <Th>Total spent</Th>
            <Th>Last order</Th>
            <Th className="text-center">Actions</Th>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeleton rows={5} colSpan={5} />
            ) : filtered.length === 0 ? (
              <TableEmpty
                icon={Users}
                title="No customers yet"
                subtitle="When shoppers place orders, they will appear here automatically."
                colSpan={5}
              />
            ) : (
              filtered.map((c, index) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className={tdClass}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
                        {(c.name || 'C')
                          .split(' ')
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {c.name}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 truncate">
                          <Mail size={11} /> {c.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className={tdClass}>
                    <SoftBadge color="indigo">{c.orderCount}</SoftBadge>
                  </td>
                  <td className={`${tdClass} font-bold text-slate-900 dark:text-white tabular-nums`}>
                    ₹{c.totalSpent.toLocaleString('en-IN')}
                  </td>
                  <td className={`${tdClass} text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap`}>
                    {c.lastOrderAt
                      ? new Date(c.lastOrderAt).toLocaleString([], {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </td>
                  <td className={`${tdClass} text-center`}>
                    {blocking[c.id] ? (
                      <Loader2 size={16} className="animate-spin text-slate-400 mx-auto" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomer(c.id)}
                        className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500 text-white text-[11px] font-bold shadow-sm transition-colors"
                        title="Block this customer from your shop"
                      >
                        <Trash2 size={12} />
                        Block
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))
            )}
          </TableBody>
        </DataTable>
      </SurfaceCard>
    </PageShell>
  );
};

export default VendorCustomers;
