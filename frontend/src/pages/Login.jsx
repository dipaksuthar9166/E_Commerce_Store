import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { BrandMark } from '../components/BrandMark';
import toast from 'react-hot-toast';
import { playSuccessSound } from '../utils/sound';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);

    if (result.success && result.user) {
      playSuccessSound();
      toast.success(`Welcome back, ${result.user.name || 'User'}!`);
      
      // Trigger the transition animation
      setShowSuccessAnim(true);
      
      // Delay navigation to let the animation play
      setTimeout(() => {
        if (result.user.role === 'admin') navigate('/admin');
        else if (result.user.role === 'vendor') navigate('/vendor');
        else if (result.user.role === 'delivery') navigate('/delivery');
        else navigate('/');
      }, 1500);
    } else {
      setError(result.error || 'Invalid email or password');
      setIsLoading(false);
    }
  };

  if (showSuccessAnim) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-blue-600 overflow-hidden">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.2, 1], opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.3)] mb-6"
        >
          <BrandMark size="xl" />
        </motion.div>
        
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-white text-3xl font-bold tracking-tight"
        >
          Logging you in...
        </motion.h1>

        {/* Expanding circle that covers screen to transition */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 100 }}
          transition={{ delay: 1, duration: 0.6, ease: "easeInOut" }}
          className="absolute w-10 h-10 bg-gray-50 rounded-full z-[-1]"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-purple-600/20 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[1000px] flex rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white/5 backdrop-blur-xl border border-white/10 mx-4 z-10">
        
        {/* Left Side: Branding / Image (Hidden on mobile) */}
        <div className="hidden md:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-900 text-white">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-40"></div>
          
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 mb-2 hover:scale-105 transition-transform">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-lg">
                <BrandMark size="lg" />
              </div>
              <span className="font-black text-3xl tracking-tight text-white drop-shadow-md">MERSKO</span>
            </Link>
            <p className="text-blue-200 text-sm font-medium tracking-wide">The Premium Grocery Experience</p>
          </div>

          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-4 leading-tight">Fast delivery.<br/>Fresh products.<br/>Happy you.</h2>
            <p className="text-blue-100/80 text-sm">Join thousands of users enjoying lightning-fast delivery of daily essentials.</p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 bg-white flex flex-col justify-center">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="md:hidden flex items-center gap-2 mb-8">
              <BrandMark size="lg" />
              <span className="font-extrabold text-2xl tracking-tight text-gray-900">MERSKO</span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-gray-500 text-sm mb-8 font-medium">Please enter your details to sign in.</p>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 mb-6 border border-red-100 shadow-sm"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-semibold">{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Email</label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-gray-100 text-gray-900 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Password</label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-gray-100 text-gray-900 rounded-2xl py-3.5 pl-12 pr-12 text-sm font-medium focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1">
                <Link to="/forgot-password" className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-600/20 disabled:opacity-70 transition-all shadow-lg shadow-blue-600/30 mt-4 active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-gray-100 pt-8">
              <p className="text-sm font-medium text-gray-500">
                Don't have an account?{' '}
                <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
                  Create Account
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
