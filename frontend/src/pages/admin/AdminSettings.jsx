import React, { useState, useEffect } from 'react';
import { Settings, Shield, Percent, Truck, Save, Info, Image } from 'lucide-react';
import api from '../../api/axios';

const AdminSettings = () => {
  const [commission, setCommission] = useState(10);
  const [riderFee, setRiderFee] = useState(40);
  const [saved, setSaved] = useState(false);

  const defaultBanners = [
    { title: "Summer Sale", image: "https://via.placeholder.com/800x400", link: "/category/summer" },
    { title: "New Arrivals", image: "https://via.placeholder.com/800x400", link: "/category/new" }
  ];
  const [bannersJson, setBannersJson] = useState(JSON.stringify(defaultBanners, null, 2));

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await api.get('/admin/config');
        if (data) {
          if (data.commissionRate) setCommission(data.commissionRate);
          if (data.banners) setBannersJson(JSON.stringify(data.banners, null, 2));
        }
      } catch (err) {
        console.error('Failed to fetch config', err);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let parsedBanners = [];
      try {
        parsedBanners = JSON.parse(bannersJson);
      } catch (e) {
        alert('Invalid JSON in Banners field');
        return;
      }
      await api.put('/admin/config', { 
        commissionRate: Number(commission),
        banners: parsedBanners
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to save config');
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <Settings className="text-slate-700" /> Platform Settings
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Configure platform parameters, commissions, and rider payouts</p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Platform Commission (%)</label>
          <div className="relative">
            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="number"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              className="pl-10 block w-full border border-gray-200 rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 bg-gray-50 transition"
              required
            />
          </div>
          <span className="text-[10px] text-gray-400 mt-1.5 block">Standard fee charged on all shop sales (gross amount).</span>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Rider Flat Payout (₹)</label>
          <div className="relative">
            <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="number"
              value={riderFee}
              onChange={(e) => setRiderFee(e.target.value)}
              className="pl-10 block w-full border border-gray-200 rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 bg-gray-50 transition"
              required
            />
          </div>
          <span className="text-[10px] text-gray-400 mt-1.5 block">Fixed fee paid to delivery boy per successful delivery.</span>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Image className="h-4 w-4" /> Homepage Advertisement Banners (JSON)
          </label>
          <textarea
            rows={7}
            value={bannersJson}
            onChange={(e) => setBannersJson(e.target.value)}
            className="block w-full border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500 bg-gray-50 transition font-mono whitespace-pre"
          />
          <span className="text-[10px] text-gray-400 mt-1.5 block">Update the banner array with title, image, and link properties to display on the homepage.</span>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-sm shadow-md transition"
        >
          <Save size={16} /> Save Configuration
        </button>

        {saved && (
          <p className="text-center text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg p-2 animate-pulse">
            Configuration saved successfully! All transactions will process with updated rates.
          </p>
        )}
      </form>
    </div>
  );
};

export default AdminSettings;
