import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Phone, Bike, Mail, ShieldCheck, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DeliveryProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getVehicleEmoji = (type) => {
    switch (type) {
      case 'bicycle': return '🚲';
      case 'motorcycle': return '🛵';
      case 'auto': return '🛺';
      case 'car': return '🚗';
      default: return '🚴';
    }
  };

  return (
    <div className="px-4 py-6 space-y-5 max-w-md mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-gray-900">My Profile</h1>
        <p className="text-xs text-gray-400 mt-1">Manage your rider details and vehicle registration</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 flex flex-col items-center text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-orange-100">
          {user?.name?.charAt(0).toUpperCase() || 'R'}
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{user?.name}</h2>
          <p className="text-xs text-orange-600 font-semibold bg-orange-50 px-3 py-1 rounded-full border border-orange-100 mt-1.5 inline-flex items-center gap-1">
            <ShieldCheck size={14} /> Approved Rider
          </p>
        </div>
      </div>

      {/* Details list */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
        {/* Email */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">
            <Mail size={16} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Email Address</p>
            <p className="text-sm font-semibold text-gray-800">{user?.email}</p>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">
            <Phone size={16} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Phone Number</p>
            <p className="text-sm font-semibold text-gray-800">{user?.phone || '+91 99999 99999'}</p>
          </div>
        </div>

        {/* Vehicle */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">
            <Bike size={16} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Vehicle Type</p>
            <p className="text-sm font-semibold text-gray-800 capitalize">
              {getVehicleEmoji(user?.vehicleType)} {user?.vehicleType || 'Bicycle (Standard)'}
            </p>
          </div>
        </div>
      </div>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 text-red-600 hover:bg-red-100 transition rounded-2xl font-bold text-sm border border-red-100 shadow-sm"
      >
        <LogOut size={16} /> Logout Account
      </button>
    </div>
  );
};

export default DeliveryProfile;
