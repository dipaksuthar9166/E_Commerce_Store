import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Clock, CheckCircle, Truck, Package, XCircle } from 'lucide-react';
import api from '../../api/axios';

const STATUS_STYLES = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock, label: 'Pending' },
  accepted: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle, label: 'Accepted' },
  packing: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: Package, label: 'Packing' },
  ready_for_pickup: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Package, label: 'Ready' },
  out_for_delivery: { bg: 'bg-orange-100', text: 'text-orange-700', icon: Truck, label: 'Out for Delivery' },
  delivered: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Delivered' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Cancelled' },
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/admin/orders');
        setOrders(data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (order.userId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.shopId?.shopName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag className="text-blue-600" /> Global Order Monitor
        </h1>
        <p className="text-gray-500 text-sm mt-1">Track and monitor all orders across the platform</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by Order ID, Customer, or Shop..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="all">All Statuses</option>
              {Object.keys(STATUS_STYLES).map(status => (
                <option key={status} value={status}>{STATUS_STYLES[status].label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No orders found</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/80 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Order ID / Date</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Shop</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Delivery Partner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map(order => {
                  const style = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
                  const Icon = style.icon;
                  return (
                    <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 truncate max-w-[120px]">#{order._id.slice(-8)}</div>
                        <div className="text-[11px] text-gray-500">{new Date(order.createdAt).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{order.userId?.name || 'Unknown'}</div>
                        <div className="text-[11px] text-gray-500">{order.userId?.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-blue-600">
                        {order.shopId?.shopName || 'Unknown Shop'}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        ₹{order.totalAmount?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${style.bg} ${style.text}`}>
                          <Icon size={12} />
                          {style.label}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {order.deliveryBoyId ? order.deliveryBoyId.name : <span className="italic text-gray-400">Unassigned</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>

  );
};

export default AdminOrders;