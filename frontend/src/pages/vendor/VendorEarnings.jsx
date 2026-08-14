import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  IndianRupee,
  Package,
  AlertCircle,
  Download,
  Percent,
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
  DataTable,
  TableHead,
  Th,
  TableBody,
  TableEmpty,
  TableSkeleton,
  TableFooter,
  tdClass,
  SoftBadge,
  SecondaryButton,
  PrimaryButton,
} from '../../components/ui/PageUI';

const VendorEarnings = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/vendor/orders');
      setOrders(Array.isArray(data?.orders) ? data.orders : Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching earnings data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const calculateCommission = (amount) => Math.round(amount * 0.1);
  const calculateNetEarnings = (amount) => amount - calculateCommission(amount);

  const deliveredOrders = useMemo(
    () => orders.filter((o) => o.status === 'delivered'),
    [orders]
  );

  const totalGrossSales = deliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalCommission = calculateCommission(totalGrossSales);
  const totalNetEarnings = calculateNetEarnings(totalGrossSales);

  const today = new Date().toDateString();
  const todayOrders = deliveredOrders.filter(
    (o) => new Date(o.updatedAt || o.createdAt).toDateString() === today
  );
  const todayGrossSales = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const todayCommission = calculateCommission(todayGrossSales);
  const todayNetEarnings = calculateNetEarnings(todayGrossSales);

  const handleExportCSV = () => {
    if (deliveredOrders.length === 0) return;

    const headers = [
      'Order ID',
      'Customer Name',
      'Customer Email',
      'Date',
      'Gross Sale (INR)',
      'Commission (INR)',
      'Net Earning (INR)',
      'Status',
    ];

    const rows = deliveredOrders.map((order) => {
      const gross = order.totalAmount || 0;
      const commission = calculateCommission(gross);
      const net = calculateNetEarnings(gross);
      return [
        order._id,
        order.userId?.name || 'Customer',
        order.userId?.email || 'N/A',
        new Date(order.updatedAt || order.createdAt).toLocaleDateString('en-IN'),
        gross,
        commission,
        net,
        'Delivered',
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Earnings_Ledger_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageShell>
      <PageHeader
        title="Earnings & Reports"
        subtitle="Track your sales, commissions, and net earnings"
        actions={
          <>
            <RefreshButton onClick={fetchEarningsData} loading={loading} />
            <PrimaryButton onClick={handleExportCSV} disabled={deliveredOrders.length === 0}>
              <Download size={15} />
              Export CSV
            </PrimaryButton>
          </>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Today's Gross"
          value={loading ? '—' : `₹${todayGrossSales.toLocaleString('en-IN')}`}
          subtitle={`${todayOrders.length} orders delivered`}
          icon={IndianRupee}
          iconColor="bg-blue-50 text-blue-500 dark:bg-blue-500/15 dark:text-blue-400"
          bar="from-blue-400 via-indigo-400 to-violet-500"
          delay={0}
        />
        <StatCard
          title="Today's Commission"
          value={loading ? '—' : `₹${todayCommission.toLocaleString('en-IN')}`}
          subtitle="10% platform fee"
          icon={Percent}
          iconColor="bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-400"
          bar="from-rose-400 via-orange-400 to-amber-400"
          delay={0.05}
        />
        <StatCard
          title="Today's Net"
          value={loading ? '—' : `₹${todayNetEarnings.toLocaleString('en-IN')}`}
          subtitle="In your account"
          icon={TrendingUp}
          iconColor="bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400"
          bar="from-emerald-400 via-teal-400 to-cyan-400"
          delay={0.1}
        />
        <StatCard
          title="Delivered"
          value={loading ? '—' : deliveredOrders.length}
          subtitle="Lifetime orders"
          icon={Package}
          iconColor="bg-violet-50 text-violet-500 dark:bg-violet-500/15 dark:text-violet-400"
          bar="from-violet-400 via-fuchsia-400 to-pink-400"
          delay={0.15}
        />
      </div>

      <SurfaceCard delay={0.12} className="!bg-gradient-to-r !from-indigo-50 !to-violet-50 dark:!from-indigo-950/40 dark:!to-violet-950/30 !border-indigo-100 dark:!border-indigo-800/50">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertCircle size={16} className="text-indigo-500" />
          Lifetime Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              Total Gross Sales
            </p>
            <p className="text-3xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
              ₹{totalGrossSales.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
              {deliveredOrders.length} delivered orders
            </p>
          </div>
          <div className="md:border-x border-indigo-200/60 dark:border-indigo-800/50 md:px-6">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              Total Commission
            </p>
            <p className="text-3xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
              −₹{totalCommission.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">10% platform fee</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              Total Net Earnings
            </p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              ₹{totalNetEarnings.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Your account balance</p>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard padding={false} delay={0.18}>
        <CardHeader
          title="Earnings Ledger (Khata)"
          subtitle={`${deliveredOrders.length} delivered order${deliveredOrders.length !== 1 ? 's' : ''}`}
          actions={
            <SecondaryButton onClick={handleExportCSV} disabled={deliveredOrders.length === 0} className="!h-9 !text-xs">
              <Download size={13} />
              Export
            </SecondaryButton>
          }
        />

        <DataTable minWidth="800px">
          <TableHead>
            <Th>Order ID</Th>
            <Th>Customer</Th>
            <Th>Date</Th>
            <Th className="text-right">Gross Sale</Th>
            <Th className="text-right">Commission</Th>
            <Th className="text-right">Net Earning</Th>
            <Th>Status</Th>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeleton rows={5} colSpan={7} />
            ) : deliveredOrders.length === 0 ? (
              <TableEmpty
                icon={Package}
                title="No delivered orders yet"
                subtitle="Your earnings will appear here once orders are delivered"
                colSpan={7}
              />
            ) : (
              deliveredOrders.map((order, index) => {
                const gross = order.totalAmount || 0;
                const commission = calculateCommission(gross);
                const net = calculateNetEarnings(gross);
                return (
                  <motion.tr
                    key={order._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className={tdClass}>
                      <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                        #{order._id?.slice(-6)}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {order.userId?.name || 'Customer'}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {order.userId?.email || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className={`${tdClass} text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap`}>
                      {new Date(order.updatedAt || order.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className={`${tdClass} text-right font-bold text-blue-600 dark:text-blue-400 tabular-nums`}>
                      ₹{gross.toLocaleString('en-IN')}
                    </td>
                    <td className={`${tdClass} text-right font-semibold text-rose-600 dark:text-rose-400 tabular-nums`}>
                      −₹{commission.toLocaleString('en-IN')}
                    </td>
                    <td className={`${tdClass} text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums`}>
                      ₹{net.toLocaleString('en-IN')}
                    </td>
                    <td className={tdClass}>
                      <SoftBadge color="emerald">Delivered</SoftBadge>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </TableBody>
        </DataTable>

        {!loading && deliveredOrders.length > 0 && (
          <TableFooter>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                ({deliveredOrders.length} orders)
              </span>
            </p>
            <div className="flex gap-6 text-sm font-bold tabular-nums">
              <span className="text-blue-600 dark:text-blue-400">
                ₹{totalGrossSales.toLocaleString('en-IN')}
              </span>
              <span className="text-rose-600 dark:text-rose-400">
                −₹{totalCommission.toLocaleString('en-IN')}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">
                ₹{totalNetEarnings.toLocaleString('en-IN')}
              </span>
            </div>
          </TableFooter>
        )}
      </SurfaceCard>
    </PageShell>
  );
};

export default VendorEarnings;
