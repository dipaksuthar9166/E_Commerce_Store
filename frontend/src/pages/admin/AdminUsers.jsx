import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Shield,
  ShoppingCart,
  Truck,
  User,
  Ban,
  CheckCircle,
  Mail,
  Calendar,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import api from '../../api/axios';

const roleConfig = {
  admin:    { label: 'Admin',    icon: Shield,       cls: 'bg-purple-900/60 text-purple-300 border border-purple-700/50' },
  vendor:   { label: 'Vendor',   icon: ShoppingCart, cls: 'bg-blue-900/60 text-blue-300 border border-blue-700/50' },
  delivery: { label: 'Delivery', icon: Truck,        cls: 'bg-orange-900/60 text-orange-300 border border-orange-700/50' },
  customer: { label: 'Customer', icon: User,         cls: 'bg-slate-700/80 text-slate-300 border border-slate-600/50' },
};

const roles = ['All', 'customer', 'vendor', 'delivery', 'admin'];

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banLoading, setBanLoading] = useState({});
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleBan = async (userId) => {
    setBanLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const { data } = await api.put(`/admin/users/${userId}/status`);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isActive: data.user.isActive } : u))
      );
    } catch (err) {
      console.error('Failed to update user', err);
    } finally {
      setBanLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const filtered = users.filter((u) => {
    const matchRole   = roleFilter === 'All' || u.role === roleFilter;
    const term = search.toLowerCase();
    const matchSearch =
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term);
    return matchRole && matchSearch;
  });

  const totalByRole = (role) => users.filter((u) => u.role === role).length;

  return (
    <div className="space-y-7">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">User Management</h1>
          <p className="text-slate-400 text-sm mt-1">View and manage all platform users across every role.</p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* ── Role Stats ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { role: 'customer', label: 'Customers',       icon: User,         color: 'text-slate-300',  bg: 'bg-slate-800 border-slate-700' },
          { role: 'vendor',   label: 'Vendors',         icon: ShoppingCart, color: 'text-blue-400',   bg: 'bg-blue-950/60 border-blue-800/50' },
          { role: 'delivery', label: 'Delivery Agents', icon: Truck,        color: 'text-orange-400', bg: 'bg-orange-950/60 border-orange-800/50' },
          { role: 'admin',    label: 'Admins',          icon: Shield,       color: 'text-purple-400', bg: 'bg-purple-950/60 border-purple-800/50' },
        ].map(({ role, label, icon: Icon, color, bg }) => (
          <div key={role} className={`${bg} border rounded-2xl p-5 flex items-center justify-between`}>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">{label}</p>
              <p className={`${color} text-4xl font-black mt-1`}>
                {loading ? '—' : totalByRole(role)}
              </p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center opacity-60 ${bg}`}>
              <Icon size={20} className={color} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Table Panel ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-b border-slate-800">
          {/* Role filter tabs */}
          <div className="flex gap-1 bg-slate-800 p-1 rounded-xl flex-wrap">
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  roleFilter === r ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                {r === 'All' ? 'All Users' : r}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm pl-9 pr-4 py-2 rounded-xl placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['User', 'Email', 'Role', 'Joined', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="animate-pulse h-8 bg-slate-800 rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-slate-500">
                    <Users size={36} className="mx-auto mb-3 opacity-30" />
                    No users match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const cfg = roleConfig[user.role] || roleConfig.customer;
                  const RoleIcon = cfg.icon;
                  const isActive = user.isActive !== false; // default true if undefined
                  return (
                    <tr key={user._id} className="hover:bg-slate-800/40 transition-colors">
                      {/* User */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <p className="text-white font-semibold text-xs whitespace-nowrap">{user.name}</p>
                        </div>
                      </td>
                      {/* Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <Mail size={11} className="text-slate-600 shrink-0" />
                          {user.email}
                        </div>
                      </td>
                      {/* Role */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${cfg.cls}`}>
                          <RoleIcon size={11} />
                          {cfg.label}
                        </span>
                      </td>
                      {/* Joined */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                          <Calendar size={11} className="shrink-0" />
                          {new Date(user.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          isActive
                            ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/40'
                            : 'bg-red-900/50 text-red-400 border border-red-700/40'
                        }`}>
                          {isActive ? 'Active' : 'Banned'}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4">
                        {user.role !== 'admin' && (
                          banLoading[user._id] ? (
                            <Loader2 size={16} className="animate-spin text-slate-400" />
                          ) : (
                            isActive ? (
                                <button
                                    onClick={() => toggleBan(user._id)}
                                    title="Deactivate User"
                                    className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => toggleBan(user._id)}
                                    title="Reactivate User"
                                    className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors bg-emerald-700/60 hover:bg-emerald-600 text-emerald-300 hover:text-white"
                                >
                                    <CheckCircle size={11} /> Unban
                                </button>
                            )
                          )
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && (
          <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between">
            <p className="text-slate-500 text-xs">
              Showing <span className="text-slate-300 font-semibold">{filtered.length}</span> of{' '}
              <span className="text-slate-300 font-semibold">{users.length}</span> users
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
