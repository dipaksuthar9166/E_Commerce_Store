import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Lock, UserPlus, AlertCircle, Store, MapPin, Truck, ShoppingBag } from 'lucide-react';
import { BrandMark } from '../components/BrandMark';

const ROLES = [
  { key: 'customer', label: 'Customer', icon: ShoppingBag, color: 'blue', desc: 'Order from local shops' },
  { key: 'vendor', label: 'Vendor', icon: Store, color: 'emerald', desc: 'Sell your products' },
  { key: 'delivery', label: 'Delivery Boy', icon: Truck, color: 'orange', desc: 'Deliver orders & earn' },
];

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
    shopName: '',
    address: '',
    phone: '',
    vehicleType: '',
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await register(formData);

    if (result.success && result.user) {
      if (result.user.role === 'admin') navigate('/admin');
      else if (result.user.role === 'vendor') navigate('/vendor');
      else if (result.user.role === 'delivery') navigate('/delivery');
      else navigate('/');
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  };

  const selectedRole = ROLES.find(r => r.key === formData.role);
  const colorMap = {
    blue: { bg: 'bg-blue-600', ring: 'ring-blue-500', border: 'border-blue-500', light: 'bg-blue-50 text-blue-700 border-blue-200' },
    emerald: { bg: 'bg-emerald-600', ring: 'ring-emerald-500', border: 'border-emerald-500', light: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    orange: { bg: 'bg-orange-500', ring: 'ring-orange-500', border: 'border-orange-500', light: 'bg-orange-50 text-orange-700 border-orange-200' },
  };
  const colors = colorMap[selectedRole?.color || 'blue'];

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">

        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <BrandMark />
            <span className="font-extrabold text-2xl tracking-tight text-gray-900">MERSKO</span>
          </Link>
          <h2 className="text-2xl font-extrabold text-gray-900">Create Account</h2>
          <p className="text-gray-500 mt-1 text-sm">Join MERSKO as a {selectedRole?.label}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 mb-6 border border-red-100">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Role Selection Cards ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">I want to join as</p>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(({ key, label, icon: Icon, color, desc }) => {
                const c = colorMap[color];
                const isSelected = formData.role === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: key })}
                    className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all text-center gap-1.5 ${
                      isSelected
                        ? `${c.border} ${c.light} shadow-sm`
                        : 'border-gray-200 hover:border-gray-300 text-gray-500'
                    }`}
                  >
                    <Icon size={20} className={isSelected ? '' : 'text-gray-400'} />
                    <span className="text-xs font-bold leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">{selectedRole?.desc}</p>
          </div>

          {/* ── Full Name ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text" name="name" required
                value={formData.name} onChange={handleChange}
                className="pl-10 block w-full border border-gray-200 rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition"
                placeholder="Your full name"
              />
            </div>
          </div>

          {/* ── Email ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email" name="email" required
                value={formData.email} onChange={handleChange}
                className="pl-10 block w-full border border-gray-200 rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* ── Password ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="password" name="password" required minLength={6}
                value={formData.password} onChange={handleChange}
                className="pl-10 block w-full border border-gray-200 rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition"
                placeholder="Min. 6 characters"
              />
            </div>
          </div>

          {/* ── Vendor-only Fields ── */}
          {formData.role === 'vendor' && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">🏪 Shop Details</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text" name="shopName" required
                    value={formData.shopName} onChange={handleChange}
                    className="pl-10 block w-full border border-gray-200 rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 transition"
                    placeholder="My Grocery Store"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text" name="address" required
                    value={formData.address} onChange={handleChange}
                    className="pl-10 block w-full border border-gray-200 rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 transition"
                    placeholder="123 Market St, City"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Delivery-only Fields ── */}
          {formData.role === 'delivery' && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">🛵 Rider Details</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">+91</span>
                  <input
                    type="tel" name="phone"
                    value={formData.phone} onChange={handleChange}
                    className="pl-12 block w-full border border-gray-200 rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 transition"
                    placeholder="9876543210"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    name="vehicleType"
                    value={formData.vehicleType} onChange={handleChange}
                    className="pl-10 block w-full border border-gray-200 rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 transition appearance-none"
                  >
                    <option value="">Select vehicle</option>
                    <option value="bicycle">🚲 Bicycle</option>
                    <option value="motorcycle">🛵 Motorcycle / Scooter</option>
                    <option value="auto">🛺 Auto Rickshaw</option>
                    <option value="car">🚗 Car</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded-lg p-2">
                ⚠️ Your account will be reviewed and activated by the admin before you can start delivering.
              </p>
            </div>
          )}

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white ${colors.bg} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 transition-all hover:scale-[1.01] active:scale-[0.99] mt-2`}
          >
            {isLoading ? 'Creating account...' : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Create {selectedRole?.label} Account
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
