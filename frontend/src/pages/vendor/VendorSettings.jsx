import React, { useState, useEffect } from 'react';
import {
  Store,
  MapPin,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Lock,
  Info,
} from 'lucide-react';
import api from '../../api/axios';

const ReadOnlyField = ({ label, value, icon: Icon, hint }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
    <div className="relative flex items-center">
      {Icon && (
        <div className="absolute left-3 text-gray-400">
          <Icon size={15} />
        </div>
      )}
      <input
        type="text"
        readOnly
        value={value || '—'}
        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 font-medium cursor-not-allowed focus:outline-none"
      />
      <div className="absolute right-3 text-gray-300">
        <Lock size={13} />
      </div>
    </div>
    {hint && (
      <p className="flex items-center gap-1 text-[11px] text-gray-400 font-medium mt-1">
        <Info size={10} className="shrink-0" /> {hint}
      </p>
    )}
  </div>
);

const VendorSettings = () => {
  const [shop, setShop] = useState({ shopName: '', address: '', isActive: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchShopProfile();
  }, []);

  const fetchShopProfile = async () => {
    try {
      const { data } = await api.get('/vendor/dashboard');
      if (data.shop) {
        setShop({
          shopName: data.shop.shopName || '',
          address: data.shop.address || '',
          isActive: data.shop.isActive !== false,
          _id: data.shop._id,
        });
      }
    } catch (error) {
      console.error('Error fetching shop profile', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      const { data } = await api.put('/vendor/shop/toggle-online');
      setShop((prev) => ({ ...prev, isActive: data.isOnline }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (error) {
      console.error('Error updating shop', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Loading shop settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          View your shop details and manage its availability.
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Store size={18} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-base">Shop Information</h2>
            <p className="text-xs text-gray-400 font-medium">Read-only · Contact admin to make changes</p>
          </div>
        </div>

        <ReadOnlyField
          label="Shop Name"
          value={shop.shopName}
          icon={Store}
          hint="To modify your shop name, contact the platform administrator."
        />

        <ReadOnlyField label="Shop Address" value={shop.address} icon={MapPin} />

        <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
          <div className={`w-2.5 h-2.5 rounded-full ${shop.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className="text-sm font-medium text-gray-700">
            Shop is currently{' '}
            <span className={shop.isActive ? 'text-green-600 font-semibold' : 'text-gray-400'}>
              {shop.isActive ? 'Active' : 'Inactive'}
            </span>
          </span>
          <span
            className={`ml-auto text-[10px] font-bold px-2.5 py-1 rounded-md ${
              shop.isActive
                ? 'bg-green-50 text-green-600 border border-green-100'
                : 'bg-gray-100 text-gray-400 border border-gray-200'
            }`}
          >
            {shop.isActive ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <ToggleRight size={18} className="text-orange-500" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">Shop Availability</h2>
              <p className="text-xs text-gray-400 font-medium">Control your shop's visibility on the platform</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {shop.isActive ? 'Deactivate Your Shop' : 'Activate Your Shop'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 max-w-xs leading-relaxed">
                {shop.isActive
                  ? 'Customers will no longer be able to find or order from your shop until you reactivate.'
                  : 'Your shop will become visible and customers can place orders again.'}
              </p>
            </div>

            <div
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0 ${
                shop.isActive ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
                  shop.isActive ? 'left-6' : 'left-0.5'
                }`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`w-full py-2.5 rounded-lg font-medium text-sm text-white transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${
              shop.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : shop.isActive ? (
              <>
                <ToggleLeft size={17} />
                Deactivate Shop
              </>
            ) : (
              <>
                <ToggleRight size={17} />
                Activate Shop
              </>
            )}
          </button>

          {success && (
            <div className="flex items-center gap-2.5 bg-green-50 border border-green-100 text-green-700 rounded-lg px-4 py-3">
              <CheckCircle2 size={16} className="shrink-0" />
              <p className="text-xs font-semibold">Shop status updated successfully!</p>
            </div>
          )}
        </div>
      </form>

      <div className="bg-red-50 border border-red-100 rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <ShieldAlert size={18} className="text-red-600" />
          </div>
          <div>
            <h2 className="font-bold text-red-800 text-base">Danger Zone</h2>
            <p className="text-xs text-red-400 font-medium">Irreversible actions — proceed with caution</p>
          </div>
        </div>
        <p className="text-red-700 text-sm leading-relaxed">
          To permanently deactivate or remove your shop from the platform, please contact{' '}
          <span className="font-bold">platform support</span>. This action cannot be undone and will remove all
          your listings.
        </p>
        <div className="flex items-center gap-2 text-red-500 text-xs font-medium bg-red-100/60 rounded-lg px-4 py-2.5 border border-red-100">
          <Info size={12} />
          Contact admin@platform.com for shop deletion requests
        </div>
      </div>
    </div>
  );
};

export default VendorSettings;
