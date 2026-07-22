import React, { useState, useEffect } from 'react';
import { CalendarDays, ClipboardList, Bike, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../api/axios';

const DeliveryHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/delivery/stats');
      setHistory(data.history || []);
    } catch (error) {
      console.error('Error fetching rider history', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-4 max-w-md mx-auto">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <ClipboardList className="text-blue-600" /> Delivery History
        </h1>
        <p className="text-xs text-gray-400 mt-1">Review all your completed and processed deliveries</p>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center text-gray-400 text-sm font-semibold">
          No delivery history found. Keep delivering to see history!
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => {
            const dateStr = new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            const isDelivered = item.status === 'delivered';
            return (
              <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">#{item._id.slice(-6).toUpperCase()}</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    isDelivered ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {isDelivered ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {isDelivered ? 'Delivered' : 'Cancelled'}
                  </span>
                </div>
                
                <div className="text-xs text-gray-600 space-y-1">
                  <p><span className="font-semibold text-gray-900">Shop:</span> {item.shop}</p>
                  <p><span className="font-semibold text-gray-900">Customer:</span> {item.customer}</p>
                  <p className="text-[10px] text-gray-400">{dateStr}</p>
                </div>

                <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 flex items-center gap-1"><Bike size={12} /> 2.5 km</span>
                  <span className={`font-extrabold text-sm ${isDelivered ? 'text-green-600' : 'text-gray-400'}`}>
                    {isDelivered ? `+₹${item.earning}` : '₹0'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DeliveryHistory;
