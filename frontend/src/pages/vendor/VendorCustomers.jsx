import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Loader2,
  ShoppingBag,
  IndianRupee,
  Mail,
  Trash2,
} from 'lucide-react';
import api from '../../api/axios';

const VendorCustomers = () => {
  const [orders, setOrders] = useState([]);
  const [blockedCustomerIds, setBlockedCustomerIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data: ordersData } = await api.get('/vendor/orders');
        setOrders(ordersData?.orders || []);
        setBlockedCustomerIds(new Set(ordersData?.blockedCustomerIds || []));
      } catch (err) {
        console.error('Failed to load customers', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const customers = useMemo(() => {
    const map = new Map();
    orders.forEach((order) => {
      const user = order.userId;
      if (!user?._id) return; // Skip if user or user ID is missing

      const key = user._id;

      // This logic is now handled by the API, but we keep it for optimistic updates
      // if (blockedCustomerIds.has(key)) return;

      const name = user?.name || 'Customer';
      const email = user?.email || '—';
      const amount = order.totalAmount || 0;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          id: key,
          name,
          email,
          orderCount: 1,
          totalSpent: amount,
          lastOrderAt: order.createdAt,
          statuses: { [order.status]: 1 },
        });
      } else {
        existing.orderCount += 1;
        existing.totalSpent += amount;
        existing.statuses[order.status] = (existing.statuses[order.status] || 0) + 1;
        if (new Date(order.createdAt) > new Date(existing.lastOrderAt || 0)) {
          existing.lastOrderAt = order.createdAt;
          existing.name = name;
          existing.email = email;
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders, blockedCustomerIds]);

  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm('Are you sure you want to block this customer? They will not be able to order from your shop.')) {
      return;
    }

    try {
      // Optimistically update the UI
      setBlockedCustomerIds(prev => new Set(prev).add(customerId));
      await api.put(`/vendor/customers/${customerId}/block`);
      // If successful, the state is already correct.
    } catch (err) {
      console.error('Failed to block customer', err);
      // If the API call fails, revert the UI change
      setBlockedCustomerIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(customerId);
        return newSet;
      });
      // You could show an error toast here
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term)
    );
  }, [customers, search]);

  const totals = useMemo(
    () => ({
      count: customers.length,
      orders: orders.length,
      revenue: customers.reduce((s, c) => s + c.totalSpent, 0),
    }),
    [customers, orders]
  );

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Buyers who ordered from your shop — built from real order history.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Unique customers</p>
            <p className="text-xl font-bold text-gray-900">{loading ? '—' : totals.count}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
            <ShoppingBag size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total orders</p>
            <p className="text-xl font-bold text-gray-900">{loading ? '—' : totals.orders}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
            <IndianRupee size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Gross from customers</p>
            <p className="text-xl font-bold text-gray-900">
              {loading ? '—' : `₹${totals.revenue.toLocaleString('en-IN')}`}
            </p>
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="font-semibold text-gray-800">No customers yet</p>
            <p className="text-sm text-gray-500 mt-1">
              When shoppers place orders, they will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Orders</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Total spent</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Last order</th>
                  <th className="px-5 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {(c.name || 'C')
                            .split(' ')
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                            <Mail size={11} /> {c.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gray-800">{c.orderCount}</td>
                    <td className="px-5 py-3.5 font-bold text-gray-900">
                      ₹{c.totalSpent.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {c.lastOrderAt
                        ? new Date(c.lastOrderAt).toLocaleString([], {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                        <button
                            onClick={() => handleDeleteCustomer(c.id)}
                            className="text-gray-400 hover:text-red-600 p-2 rounded-md transition-colors"
                            title="Block this customer from your shop"
                        >
                            <Trash2 size={16} />
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    );
  };
export default VendorCustomers;
