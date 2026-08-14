import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Shield,
  ShoppingCart,
  Truck,
  User,
  UserCheck,
  UserPlus,
  CheckCircle,
  Loader2,
  Pencil,
  Trash2,
  AlertTriangle,
  Phone,
  ArrowUpDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import {
  PageShell,
  PageHeader,
  RefreshButton,
  StatCard,
  SurfaceCard,
  CardHeader,
  fieldClass,
  labelClass,
  PrimaryButton,
  DataTable,
  TableHead,
  Th,
  TableBody,
  TableEmpty,
  TableSkeleton,
  TableFooter,
  tdClass,
} from '../../components/ui/PageUI';

const roleConfig = {
  admin: {
    label: 'ADMIN',
    icon: Shield,
    badge:
      'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700/50',
  },
  vendor: {
    label: 'VENDOR',
    icon: ShoppingCart,
    badge:
      'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-700/50',
  },
  delivery: {
    label: 'DELIVERY',
    icon: Truck,
    badge:
      'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-700/50',
  },
  customer: {
    label: 'USER',
    icon: User,
    badge:
      'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-700/50',
  },
};

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
];

const PER_PAGE_OPTIONS = [5, 10, 20, 50];

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banLoading, setBanLoading] = useState({});
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [sortDir, setSortDir] = useState('asc');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, sortBy, perPage, sortDir]);

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

  const totalByRole = (role) => users.filter((u) => u.role === role).length;
  const activeCount = users.filter((u) => u.isActive !== false).length;
  const bannedCount = users.length - activeCount;

  const filtered = useMemo(() => {
    let list = users.filter((u) => {
      const matchRole = roleFilter === 'All' || u.role === roleFilter;
      const term = search.toLowerCase().trim();
      const matchSearch =
        !term ||
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.phone?.toLowerCase().includes(term) ||
        u.role?.toLowerCase().includes(term);
      return matchRole && matchSearch;
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = (a.name || '').localeCompare(b.name || '');
      else if (sortBy === 'email') cmp = (a.email || '').localeCompare(b.email || '');
      else if (sortBy === 'newest') cmp = new Date(b.createdAt) - new Date(a.createdAt);
      else if (sortBy === 'oldest') cmp = new Date(a.createdAt) - new Date(b.createdAt);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [users, search, roleFilter, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleNameSort = () => {
    if (sortBy === 'name') setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy('name');
      setSortDir('asc');
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Users Management"
        subtitle="Manage system users with role-based access control and comprehensive user administration."
        actions={<RefreshButton onClick={fetchUsers} loading={loading} />}
      />

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={loading ? '—' : users.length}
          subtitle="Registered users"
          icon={Users}
          iconColor="bg-indigo-50 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-400"
          bar="from-pink-400 via-fuchsia-400 to-violet-500"
          delay={0}
        />
        <StatCard
          title="Admins"
          value={loading ? '—' : totalByRole('admin')}
          subtitle="Administrator accounts"
          icon={Shield}
          iconColor="bg-amber-50 text-amber-500 dark:bg-amber-500/15 dark:text-amber-400"
          bar="from-rose-400 via-orange-400 to-amber-400"
          delay={0.05}
        />
        <StatCard
          title="Customers"
          value={loading ? '—' : totalByRole('customer')}
          subtitle="Standard user accounts"
          icon={UserCheck}
          iconColor="bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400"
          bar="from-violet-400 via-fuchsia-400 to-pink-400"
          delay={0.1}
        />
        <StatCard
          title="Vendors + Riders"
          value={loading ? '—' : totalByRole('vendor') + totalByRole('delivery')}
          subtitle={`${totalByRole('vendor')} vendors · ${totalByRole('delivery')} delivery`}
          icon={UserPlus}
          iconColor="bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-400"
          bar="from-pink-500 via-rose-400 to-orange-400"
          delay={0.15}
        />
      </div>

      {/* ── Alert (banned users) ── */}
      <AnimatePresence>
        {bannedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-3 items-start rounded-2xl border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 px-4 py-3.5">
              <AlertTriangle size={18} className="text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-rose-700 dark:text-rose-300">Banned accounts</p>
                <p className="text-sm text-rose-600/90 dark:text-rose-400/90 mt-0.5">
                  {bannedCount} user{bannedCount > 1 ? 's are' : ' is'} currently banned. You can
                  reactivate them from the Actions column.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SurfaceCard delay={0.12}>
        <div className="flex flex-col xl:flex-row xl:items-end gap-4">
          <div className="flex-1 min-w-0">
            <label className={labelClass}>Search Users</label>
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              />
              <input
                type="text"
                placeholder="Search by name, email, phone, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${fieldClass} pl-10 pr-4`}
              />
            </div>
          </div>

          <div className="w-full sm:w-28">
            <label className={labelClass}>Per Page</label>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className={fieldClass}
            >
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-36">
            <label className={labelClass}>Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={fieldClass}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-40">
            <label className={labelClass}>Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={fieldClass}
            >
              <option value="All">All Roles</option>
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="delivery">Delivery</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="w-full sm:w-auto">
            <label className="hidden sm:block text-xs font-bold text-transparent mb-1.5 select-none">
              Add
            </label>
            <PrimaryButton
              className="w-full sm:w-auto"
              title="User creation is handled via Register"
              onClick={() => window.open('/register', '_blank')}
            >
              <UserPlus size={16} />
              Add User
            </PrimaryButton>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard padding={false} delay={0.18}>
        <CardHeader
          title="Users Directory"
          subtitle={`${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
        />

        <DataTable minWidth="800px">
          <TableHead>
            <Th>
              <button
                type="button"
                onClick={toggleNameSort}
                className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
              >
                Name
                <ArrowUpDown size={12} className="opacity-50" />
                {sortBy === 'name' && (
                  <span className="text-indigo-500 dark:text-indigo-400 normal-case tracking-normal font-semibold">
                    {sortDir === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            </Th>
            {['Email', 'Phone', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
              <Th key={h}>{h}</Th>
            ))}
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeleton rows={5} colSpan={7} />
            ) : paged.length === 0 ? (
              <TableEmpty
                icon={Users}
                title="No users match your search."
                subtitle="Try a different name, email, or role."
                colSpan={7}
              />
            ) : (
              paged.map((user, index) => {
                const cfg = roleConfig[user.role] || roleConfig.customer;
                const RoleIcon = cfg.icon;
                const isActive = user.isActive !== false;
                return (
                  <motion.tr
                    key={user._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className={tdClass}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20 dark:shadow-indigo-900/40">
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                          {user.name || '—'}
                        </span>
                      </div>
                    </td>
                    <td className={`${tdClass} text-slate-600 dark:text-slate-300 whitespace-nowrap`}>
                      {user.email || '—'}
                    </td>
                    <td className={`${tdClass} text-slate-500 dark:text-slate-400 whitespace-nowrap`}>
                      <span className="inline-flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-300 dark:text-slate-600" />
                        {user.phone || user.mobile || '—'}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}
                      >
                        <RoleIcon size={11} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700/50'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-700/50'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {isActive ? 'Active' : 'Banned'}
                      </span>
                    </td>
                    <td className={`${tdClass} text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap`}>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          title="View profile"
                          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition-colors"
                          onClick={() => {
                            alert(
                              `${user.name}\n${user.email}\nRole: ${user.role}\nPhone: ${
                                user.phone || user.mobile || 'N/A'
                              }`
                            );
                          }}
                        >
                          <Pencil size={12} />
                          Edit
                        </button>
                        {user.role !== 'admin' &&
                          (banLoading[user._id] ? (
                            <span className="inline-flex items-center justify-center h-8 w-16">
                              <Loader2
                                size={16}
                                className="animate-spin text-slate-400 dark:text-slate-500"
                              />
                            </span>
                          ) : isActive ? (
                            <button
                              type="button"
                              onClick={() => toggleBan(user._id)}
                              title="Ban user"
                              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500 text-white text-[11px] font-bold shadow-sm transition-colors"
                            >
                              <Trash2 size={12} />
                              Ban
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleBan(user._id)}
                              title="Unban user"
                              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-[11px] font-bold shadow-sm transition-colors"
                            >
                              <CheckCircle size={12} />
                              Unban
                            </button>
                          ))}
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </TableBody>
        </DataTable>

        {!loading && filtered.length > 0 && (
          <TableFooter>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {filtered.length}
              </span>{' '}
              users
              {users.length !== filtered.length && (
                <span className="text-slate-400 dark:text-slate-500">
                  {' '}
                  (filtered from {users.length})
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums px-2">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </TableFooter>
        )}
      </SurfaceCard>
    </PageShell>
  );
};

export default AdminUsers;
