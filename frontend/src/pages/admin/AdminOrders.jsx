import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  Package,
  XCircle,
  RefreshCw,
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
  SelectField,
  SoftBadge,
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

const STATUS_META = {
  pending: { color: 'amber', icon: Clock, label: 'Pending' },
  accepted: { color: 'blue', icon: CheckCircle, label: 'Accepted' },
  packing: { color: 'indigo', icon: Package, label: 'Packing' },
  ready_for_pickup: { color: 'violet', icon: Package, label: 'Ready' },
  out_for_delivery: { color: 'orange', icon: Truck, label: 'Out for Delivery' },
  delivered: { color: 'emerald', icon: CheckCircle, label: 'Delivered' },
  cancelled: { color: 'rose', icon: XCircle, label: 'Cancelled' },
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/orders');
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.userId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.shopId?.shopName || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const countBy = (status) => orders.filter((o) => o.status === status).length;

  return (
    <PageShell>
      <PageHeader
        title="Global Order Monitor"
        subtitle="Track and monitor all orders across the platform"
        actions={<RefreshButton onClick={fetchOrders} loading={loading} />}
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={loading ? '—' : orders.length}
          subtitle="All statuses"
          icon={ShoppingBag}
          iconColor="bg-indigo-50 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-400"
          bar="from-pink-400 via-fuchsia-400 to-violet-500"
          delay={0}
        />
        <StatCard
          title="Pending"
          value={loading ? '—' : countBy('pending')}
          subtitle="Awaiting action"
          icon={Clock}
          iconColor="bg-amber-50 text-amber-500 dark:bg-amber-500/15 dark:text-amber-400"
          bar="from-amber-400 via-orange-400 to-rose-400"
          delay={0.05}
        />
        <StatCard
          title="In Transit"
          value={loading ? '—' : countBy('out_for_delivery')}
          subtitle="Out for delivery"
          icon={Truck}
          iconColor="bg-orange-50 text-orange-500 dark:bg-orange-500/15 dark:text-orange-400"
          bar="from-orange-400 via-amber-400 to-yellow-400"
          delay={0.1}
        />
        <StatCard
          title="Delivered"
          value={loading ? '—' : countBy('delivered')}
          subtitle="Completed orders"
          icon={CheckCircle}
          iconColor="bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400"
          bar="from-emerald-400 via-teal-400 to-cyan-500"
          delay={0.15}
        />
      </div>

      <SurfaceCard delay={0.12}>
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <SearchField
            label="Search Orders"
            className="flex-1"
            placeholder="Search by Order ID, Customer, or Shop..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <SelectField
            label="Status"
            className="w-full md:w-48"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            {Object.keys(STATUS_META).map((status) => (
              <option key={status} value={status}>
                {STATUS_META[status].label}
              </option>
            ))}
          </SelectField>
        </div>
      </SurfaceCard>

      <SurfaceCard padding={false} delay={0.18}>
        <CardHeader
          title="Orders Directory"
          subtitle={`${filteredOrders.length} result${filteredOrders.length !== 1 ? 's' : ''}`}
        />

        <DataTable minWidth="900px">
          <TableHead>
            {['Order ID / Date', 'Customer', 'Shop', 'Total Amount', 'Status', 'Delivery Partner'].map(
              (h) => (
                <Th key={h}>{h}</Th>
              )
            )}
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeleton rows={6} colSpan={6} />
            ) : filteredOrders.length === 0 ? (
              <TableEmpty
                icon={ShoppingBag}
                title="No orders found"
                subtitle="Try a different search or status filter."
                colSpan={6}
              />
            ) : (
              filteredOrders.map((order) => {
                const meta = STATUS_META[order.status] || STATUS_META.pending;
                const Icon = meta.icon;
                return (
                  <Tr key={order._id}>
                    <td className={tdClass}>
                      <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">
                        #{order._id.slice(-8)}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {new Date(order.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className={tdClass}>
                      <div className="font-medium text-slate-800 dark:text-slate-100">
                        {order.userId?.name || 'Unknown'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {order.userId?.email || 'N/A'}
                      </div>
                    </td>
                    <td className={`${tdClass} font-medium text-indigo-600 dark:text-indigo-400`}>
                      {order.shopId?.shopName || 'Unknown Shop'}
                    </td>
                    <td className={`${tdClass} font-bold text-slate-900 dark:text-white`}>
                      ₹{order.totalAmount?.toLocaleString('en-IN')}
                    </td>
                    <td className={tdClass}>
                      <SoftBadge color={meta.color}>
                        <Icon size={12} />
                        {meta.label}
                      </SoftBadge>
                    </td>
                    <td className={`${tdClass} text-slate-500 dark:text-slate-400 text-xs`}>
                      {order.deliveryBoyId ? (
                        order.deliveryBoyId.name
                      ) : (
                        <span className="italic text-slate-400 dark:text-slate-500">Unassigned</span>
                      )}
                    </td>
                  </Tr>
                );
              })
            )}
          </TableBody>
        </DataTable>

        {!loading && filteredOrders.length > 0 && (
          <TableFooter>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {filteredOrders.length}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{orders.length}</span>{' '}
              orders
            </p>
          </TableFooter>
        )}
      </SurfaceCard>
    </PageShell>
  );
};

export default AdminOrders;
