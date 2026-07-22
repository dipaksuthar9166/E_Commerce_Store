import React, { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, AlertCircle, ShoppingBag, ShieldCheck, Users, Store, Loader2 } from 'lucide-react';
import api from '../../api/axios';

const AdminFinances = () => {
  const [finances, setFinances] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinances();
  }, []);

  const fetchFinances = async () => {
    try {
      const { data } = await api.get('/admin/finances');
      setFinances(data);
    } catch (error) {
      console.error('Error fetching admin finances', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Loading platform ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Financial Ledger</h1>
        <p className="text-gray-500 text-sm mt-0.5">Monitor gross platform revenue, commission collected, and payouts</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Sales (Gross)</span>
            <ShoppingBag size={20} />
          </div>
          <p className="text-2xl font-black text-gray-900 mt-4">₹{finances?.totalSales || 0}</p>
        </div>

        {/* Platform Revenue (Commission) */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Commission (10%)</span>
            <TrendingUp size={20} />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-4">₹{finances?.platformCommission || 0}</p>
        </div>

        {/* Rider Payouts */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Rider Payouts</span>
            <AlertCircle size={20} />
          </div>
          <p className="text-2xl font-black text-rose-600 mt-4">₹{finances?.riderPayouts || 0}</p>
        </div>

        {/* Net Profit */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-2xl text-white shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/80">
            <span className="text-xs font-bold uppercase tracking-wider">Net Profit</span>
            <ShieldCheck size={20} />
          </div>
          <p className="text-2xl font-black mt-4">₹{finances?.netProfit || 0}</p>
        </div>
      </div>

      {/* Platform Activity Overview */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
        <h2 className="font-extrabold text-gray-900 text-base">Platform Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">Active Riders</p>
              <p className="text-lg font-black text-gray-800">{finances?.activeRidersCount || 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Store size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">Active Shops</p>
              <p className="text-lg font-black text-gray-800">{finances?.activeShopsCount || 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <ShoppingBag size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">Total Orders Processed</p>
              <p className="text-lg font-black text-gray-800">{finances?.totalOrdersCount || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFinances;
