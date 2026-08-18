import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Lock, UserPlus, AlertCircle, Store, MapPin, Truck, ShoppingBag, ArrowRight } from 'lucide-react';
import { BrandMark } from '../components/BrandMark';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { playSuccessSound } from '../utils/sound';

const ROLES = [
  { key: 'customer', label: 'Customer', icon: ShoppingBag, color: 'blue', desc: 'Shop easily' },
  { key: 'vendor', label: 'Vendor', icon: Store, color: 'emerald', desc: 'Sell online' },
  { key: 'delivery', label: 'Rider', icon: Truck, color: 'orange', desc: 'Earn money' },
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
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSuccess = (userData) => {
    playSuccessSound();
    toast.success(`Welcome, ${userData.name || 'User'}! 🎉`);
    setTimeout(() => {
      if (userData.role === 'admin') navigate('/admin');
      else if (userData.role === 'vendor') navigate('/vendor');
      else if (userData.role === 'delivery') navigate('/delivery');
      else navigate('/');
    }, 1500);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await register(formData);

    if (result.success && result.user) {
      handleSuccess(result.user);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true);
    setError('');
    const result = await googleLogin(credentialResponse.credential);
    if (result.success && result.user) {
      handleSuccess(result.user);
    } else {
      setError(result.error || 'Google signup failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google signup was cancelled or failed.');
  };

  const selectedRole = ROLES.find(r => r.key === formData.role);

  const themeConfig = {
    blue: { bg: 'bg-blue-600', text: 'text-blue-600', hover: 'hover:bg-blue-700', ring: 'focus:ring-blue-500', lightBg: 'bg-blue-50', border: 'border-blue-600' },
    emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', hover: 'hover:bg-emerald-700', ring: 'focus:ring-emerald-500', lightBg: 'bg-emerald-50', border: 'border-emerald-600' },
    orange: { bg: 'bg-orange-500', text: 'text-orange-500', hover: 'hover:bg-orange-600', ring: 'focus:ring-orange-500', lightBg: 'bg-orange-50', border: 'border-orange-500' },
  };

  const theme = themeConfig[selectedRole?.color || 'blue'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden p-4 sm:p-8">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[1000px] bg-[#111111]/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col md:flex-row z-10 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Left Side - Welcome Panel */}
        <div className="md:w-5/12 p-10 md:p-12 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-r border-white/5">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
          
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <BrandMark className="w-8 h-8 group-hover:scale-105 transition-transform" />
              <span className="font-extrabold text-xl tracking-wide text-white">MERSKO</span>
            </Link>

            <div className="mt-16 md:mt-24">
              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
                Join the <br />
                <span className={`text-transparent bg-clip-text bg-gradient-to-r ${
                  formData.role === 'customer' ? 'from-blue-400 to-cyan-300' :
                  formData.role === 'vendor' ? 'from-emerald-400 to-green-300' :
                  'from-orange-400 to-amber-300'
                }`}>
                  Future of Local
                </span> <br />
                Commerce.
              </h1>
              <p className="text-gray-400 text-sm md:text-base max-w-sm leading-relaxed">
                Experience seamless ordering, powerful selling tools, and fast deliveries all in one unified platform.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-12 md:mt-0">
            <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
              <div className="flex -space-x-3">
                <img className="w-8 h-8 rounded-full border-2 border-[#111] object-cover" src="https://i.pravatar.cc/100?img=1" alt="User" />
                <img className="w-8 h-8 rounded-full border-2 border-[#111] object-cover" src="https://i.pravatar.cc/100?img=2" alt="User" />
                <img className="w-8 h-8 rounded-full border-2 border-[#111] object-cover" src="https://i.pravatar.cc/100?img=3" alt="User" />
              </div>
              <p>Join 10,000+ others</p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="md:w-7/12 p-8 md:p-12 lg:p-16">
          <h2 className="text-2xl font-bold text-white mb-2">Create an account</h2>
          <p className="text-gray-400 text-sm mb-8">Sign up in seconds and get started.</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 mb-6 animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* ── Google Login ── */}
          <div className="mb-6">
            {googleLoading ? (
              <div className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-white/10 bg-white/5 text-gray-400 text-sm font-semibold">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Signing up with Google...
              </div>
            ) : (
              <div className="google-login-wrapper">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_black"
                  size="large"
                  shape="rectangular"
                  logo_alignment="left"
                  width="400"
                  text="signup_with"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">or register with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Role Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest">Select your role</label>
              <div className="grid grid-cols-3 gap-3">
                {ROLES.map(({ key, label, icon: Icon, desc }) => {
                  const isSelected = formData.role === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: key })}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 overflow-hidden group ${
                        isSelected
                          ? `border-white/20 bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]`
                          : `border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10`
                      }`}
                    >
                      {/* Active Indicator Glow */}
                      {isSelected && (
                        <div className={`absolute top-0 w-1/2 h-1 ${theme.bg} rounded-b-full shadow-[0_0_15px_${theme.bg}]`} />
                      )}
                      <Icon size={24} className={`mb-2 transition-colors ${isSelected ? theme.text : 'text-gray-500 group-hover:text-gray-300'}`} />
                      <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-400'}`}>{label}</span>
                      <span className={`text-[10px] mt-1 ${isSelected ? 'text-gray-300' : 'text-gray-500'} hidden sm:block`}>{desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {/* Common Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-white transition-colors" />
                    <input
                      type="text" name="name" required
                      value={formData.name} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-white transition-colors" />
                    <input
                      type="email" name="email" required
                      value={formData.email} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-white transition-colors" />
                  <input
                    type="password" name="password" required minLength={6}
                    value={formData.password} onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    placeholder="Min. 6 characters"
                  />
                </div>
              </div>

              {/* Vendor Fields */}
              {formData.role === 'vendor' && (
                <div className="space-y-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider">Shop Name</label>
                      <div className="relative group">
                        <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
                        <input
                          type="text" name="shopName" required
                          value={formData.shopName} onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                          placeholder="My Store"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider">Shop Address</label>
                      <div className="relative group">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
                        <input
                          type="text" name="address" required
                          value={formData.address} onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                          placeholder="123 Market St"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Fields */}
              {formData.role === 'delivery' && (
                <div className="space-y-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-orange-400 uppercase tracking-wider">Phone</label>
                      <div className="relative group">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold group-focus-within:text-orange-400 transition-colors">+91</span>
                        <input
                          type="tel" name="phone" required
                          value={formData.phone} onChange={handleChange}
                          className="w-full pl-12 pr-4 py-3 bg-orange-500/5 border border-orange-500/20 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                          placeholder="9876543210"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-orange-400 uppercase tracking-wider">Vehicle Type</label>
                      <div className="relative group">
                        <Truck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-orange-400 transition-colors" />
                        <select
                          name="vehicleType" required
                          value={formData.vehicleType} onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-orange-500/5 border border-orange-500/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none [&>option]:bg-[#111]"
                        >
                          <option value="">Select vehicle</option>
                          <option value="bicycle">🚲 Bicycle</option>
                          <option value="motorcycle">🛵 Motorcycle</option>
                          <option value="auto">🛺 Auto Rickshaw</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-orange-400/80 bg-orange-400/10 p-3 rounded-xl border border-orange-400/20">
                    Your account will require admin approval before you can start accepting deliveries.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white ${theme.bg} ${theme.hover} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#111] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2 mt-4`}
            >
              {isLoading ? 'Creating account...' : (
                <>
                  Create Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className={`font-semibold text-white hover:${theme.text} transition-colors border-b border-dashed border-gray-600 pb-0.5`}>
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
      
      {/* Make Google button full width */}
      <style>{`
        .google-login-wrapper > div,
        .google-login-wrapper iframe,
        .google-login-wrapper > div > div {
          width: 100% !important;
        }
      `}</style>
    </div>
  );
};

export default Register;
