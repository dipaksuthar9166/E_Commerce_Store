import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Package, AlertCircle, Download, Filter } from 'lucide-react';
import api from '../../api/axios';

const VendorEarnings = () => {
  const [earnings, setEarnings] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      const [dashData, ordersData] = await Promise.all([
        api.get('/vendor/dashboard'),
        api.get('/vendor/orders'),
      ]);

      setEarnings(dashData.data);
      setOrders(ordersData.data);
    } catch (error) {
      console.error('Error fetching earnings data', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCommission = (amount) => Math.round(amount * 0.1); // 10% commission
  const calculateNetEarnings = (amount) => amount - calculateCommission(amount);

  // Calculate metrics
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const totalGrossSales = deliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalCommission = calculateCommission(totalGrossSales);
  const totalNetEarnings = calculateNetEarnings(totalGrossSales);

  // Today's metrics
  const today = new Date().toDateString();
  const todayOrders = deliveredOrders.filter(o => new Date(o.updatedAt).toDateString() === today);
  const todayGrossSales = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const todayCommission = calculateCommission(todayGrossSales);
  const todayNetEarnings = calculateNetEarnings(todayGrossSales);

  const StatCard = ({ icon: Icon, label, value, subtext, color }) => (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>₹{value.toLocaleString('en-IN')}</p>
          {subtext && <p className="text-gray-400 text-xs mt-1">{subtext}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${color === 'text-green-600' ? 'bg-green-50' : color === 'text-red-600' ? 'bg-red-50' : 'bg-blue-50'}`}>
          <Icon size={18} className={color} />
        </div>
      </div>
    </div>
  );

  const handleExportCSV = () => {
    if (deliveredOrders.length === 0) return;
    
    // Create CSV header
    const headers = ['Order ID', 'Customer Name', 'Customer Email', 'Date', 'Gross Sale (INR)', 'Commission (INR)', 'Net Earning (INR)', 'Status'];
    
    // Create CSV rows
    const rows = deliveredOrders.map(order => {
      const gross = order.totalAmount || 0;
      const commission = calculateCommission(gross);
      const net = calculateNetEarnings(gross);
      return [
        order._id,
        order.userId?.name || 'Customer',
        order.userId?.email || 'N/A',
        new Date(order.updatedAt).toLocaleDateString('en-IN'),
        gross,
        commission,
        net,
        'Delivered'
      ];
    });
    
    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');
    
    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Earnings_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Earnings & Reports</h1>
        <p className="text-gray-500 text-sm mt-0.5">Track your sales, commissions, and net earnings</p>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Today's Gross Sales"
          value={todayGrossSales}
          subtext={`${todayOrders.length} orders delivered`}
          color="text-blue-600"
        />
        <StatCard
          icon={AlertCircle}
          label="Today's Commission (10%)"
          value={todayCommission}
          subtext="Platform deduction"
          color="text-red-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Today's Net Earnings"
          value={todayNetEarnings}
          subtext="In your account"
          color="text-green-600"
        />
        <StatCard
          icon={Package}
          label="Total Delivered"
          value={deliveredOrders.length}
          subtext="This month"
          color="text-purple-600"
        />
      </div>

      {/* Lifetime Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Lifetime Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-gray-600 text-sm font-medium mb-1">Total Gross Sales</p>
            <p className="text-3xl font-bold text-blue-600">₹{totalGrossSales.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-500 mt-2">{deliveredOrders.length} delivered orders</p>
          </div>
          <div className="border-l border-r border-blue-200">
            <p className="text-gray-600 text-sm font-medium mb-1">Total Commission</p>
            <p className="text-3xl font-bold text-red-600">-₹{totalCommission.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-500 mt-2">10% platform fee</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium mb-1">Total Net Earnings</p>
            <p className="text-3xl font-bold text-green-600">₹{totalNetEarnings.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-500 mt-2">Your account balance</p>
          </div>
        </div>
      </div>

      {/* Orders Ledger */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-bold text-gray-900">Earnings Ledger (Khata)</h2>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter size={13} /> Filter
            </button>
            <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
              <Download size={13} /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600">Date</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-600">Gross Sale</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-600">Commission (10%)</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-600">Net Earning</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <div className="inline-block animate-spin">
                      <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full" />
                    </div>
                  </td>
                </tr>
              ) : deliveredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <p className="text-gray-500 font-medium">No delivered orders yet</p>
                    <p className="text-gray-400 text-xs mt-1">Your earnings will appear here once orders are delivered</p>
                  </td>
                </tr>
              ) : (
                deliveredOrders.map((order) => {
                  const gross = order.totalAmount || 0;
                  const commission = calculateCommission(gross);
                  const net = calculateNetEarnings(gross);
                  return (
                    <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <span className="font-mono text-xs font-semibold text-gray-600">#{order._id?.slice(-6)}</span>
                      </td>
                      <td className="px-6 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{order.userId?.name || 'Customer'}</p>
                          <p className="text-xs text-gray-400">{order.userId?.email || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-sm text-gray-600">
                          {new Date(order.updatedAt).toLocaleDateString('en-IN')}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-sm font-bold text-blue-600">₹{gross.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-sm font-semibold text-red-600">-₹{commission.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-sm font-bold text-green-600">₹{net.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                          Delivered
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        {deliveredOrders.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <div className="font-semibold text-gray-900">Total ({deliveredOrders.length} orders)</div>
            <div className="flex gap-8 text-sm font-bold">
              <div className="text-blue-600">₹{totalGrossSales.toLocaleString('en-IN')}</div>
              <div className="text-red-600">-₹{totalCommission.toLocaleString('en-IN')}</div>
              <div className="text-green-600">₹{totalNetEarnings.toLocaleString('en-IN')}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorEarnings;
