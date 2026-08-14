import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertCircle,
  ShoppingBag,
  ShieldCheck,
  Users,
  Store,
  Download,
} from 'lucide-react';
import api from '../../api/axios';
import {
  PageShell,
  PageHeader,
  RefreshButton,
  StatCard,
  SurfaceCard,
  CardHeader,
  PageLoader,
} from '../../components/ui/PageUI';

const AdminFinances = () => {
  const [finances, setFinances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchFinances = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/finances');
      setFinances(data);
    } catch (error) {
      console.error('Error fetching admin finances', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinances();
  }, []);

  const handleExportCSV = () => {
    if (!finances) return;
    
    const headers = [
      'Report Date',
      'Total Sales (Gross)',
      'Platform Commission (10%)',
      'Rider Payouts',
      'Net Profit',
      'Active Riders',
      'Active Shops',
      'Total Orders Processed'
    ];
    
    const row = [
      new Date().toLocaleDateString('en-IN'),
      finances.totalSales || 0,
      finances.platformCommission || 0,
      finances.riderPayouts || 0,
      finances.netProfit || 0,
      finances.activeRidersCount || 0,
      finances.activeShopsCount || 0,
      finances.totalOrdersCount || 0
    ];

    const csvContent = [headers.join(','), row.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Admin_Finances_Report_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  if (loading) {
    return (
      <PageShell>
        <PageLoader label="Loading platform ledger..." />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Financial Ledger"
        subtitle="Monitor gross platform revenue, commission collected, and payouts"
        actions={
          <div className="flex items-center gap-2">
            <RefreshButton onClick={fetchFinances} loading={loading} />
            <button
              onClick={handleExportCSV}
              disabled={loading || !finances}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Sales (Gross)"
          value={`₹${Number(finances?.totalSales || 0).toLocaleString('en-IN')}`}
          subtitle="All delivered orders"
          icon={ShoppingBag}
          iconColor="bg-indigo-50 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-400"
          bar="from-pink-400 via-fuchsia-400 to-violet-500"
          delay={0}
        />
        <StatCard
          title="Commission (10%)"
          value={`₹${Number(finances?.platformCommission || 0).toLocaleString('en-IN')}`}
          subtitle="Platform fee collected"
          icon={TrendingUp}
          iconColor="bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400"
          bar="from-emerald-400 via-teal-400 to-cyan-500"
          delay={0.05}
        />
        <StatCard
          title="Rider Payouts"
          value={`₹${Number(finances?.riderPayouts || 0).toLocaleString('en-IN')}`}
          subtitle="Delivery partner fees"
          icon={AlertCircle}
          iconColor="bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-400"
          bar="from-rose-400 via-orange-400 to-amber-400"
          delay={0.1}
        />
        <StatCard
          title="Net Profit"
          value={`₹${Number(finances?.netProfit || 0).toLocaleString('en-IN')}`}
          subtitle="Commission − rider payouts"
          icon={ShieldCheck}
          iconColor="bg-violet-50 text-violet-500 dark:bg-violet-500/15 dark:text-violet-400"
          bar="from-violet-400 via-indigo-400 to-blue-500"
          delay={0.15}
        />
      </div>

      <SurfaceCard padding={false} delay={0.12}>
        <CardHeader title="Platform Metrics" subtitle="Live activity snapshot" />
        <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Active Riders',
              value: finances?.activeRidersCount || 0,
              icon: Users,
              tone: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
            },
            {
              label: 'Active Shops',
              value: finances?.activeShopsCount || 0,
              icon: Store,
              tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
            },
            {
              label: 'Orders Processed',
              value: finances?.totalOrdersCount || 0,
              icon: ShoppingBag,
              tone: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
            },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${tone}`}
              >
                <Icon size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  {label}
                </p>
                <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </PageShell>
  );
};

export default AdminFinances;
