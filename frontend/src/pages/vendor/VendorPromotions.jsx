import React, { useState, useEffect } from 'react';
import { Zap, Tag, CheckSquare, Square, Percent, Loader2, Save } from 'lucide-react';
import api from '../../api/axios';

const VendorPromotions = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  const [discountPercent, setDiscountPercent] = useState(10);
  const [promoTag, setPromoTag] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/vendor/products');
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p._id)));
    }
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const applyDiscount = async (e) => {
    e.preventDefault();
    if (selectedIds.size === 0) return alert('Select at least one product');
    
    setSaving(true);
    try {
      await api.post('/vendor/products/bulk-discount', {
        productIds: Array.from(selectedIds),
        discountPercent: Number(discountPercent),
        promoTag: promoTag.trim()
      });
      alert('Promotions applied successfully!');
      setSelectedIds(new Set());
      setDiscountPercent(10);
      setPromoTag('');
      fetchProducts();
    } catch (error) {
      console.error('Failed to apply discount', error);
      alert('Failed to apply discounts');
    } finally {
      setSaving(false);
    }
  };

  const removeAllDiscounts = async () => {
    if (selectedIds.size === 0) return alert('Select at least one product');
    if (!window.confirm('Are you sure you want to remove discounts from the selected products?')) return;

    setSaving(true);
    try {
      await api.post('/vendor/products/bulk-discount', {
        productIds: Array.from(selectedIds),
        discountPercent: 0,
        promoTag: ''
      });
      setSelectedIds(new Set());
      fetchProducts();
    } catch (error) {
      alert('Failed to remove discounts');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <Zap className="text-orange-500 fill-orange-500" /> Flash Sales & Promotions
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Apply bulk discounts and promotional tags to your products</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Bulk Action Form */}
        <div className="lg:col-span-1 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm sticky top-24">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 flex justify-between">
            <span>Promotion Rules</span>
            <span className="text-orange-600">{selectedIds.size} selected</span>
          </h2>
          
          <form onSubmit={applyDiscount} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Discount Percentage</label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="pl-10 block w-full border border-gray-200 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Promotional Tag (Optional)</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="e.g. Diwali Special"
                  value={promoTag}
                  onChange={(e) => setPromoTag(e.target.value)}
                  maxLength={20}
                  className="pl-10 block w-full border border-gray-200 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 transition"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                disabled={saving || selectedIds.size === 0}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Apply Discount
              </button>

              <button
                type="button"
                onClick={removeAllDiscounts}
                disabled={saving || selectedIds.size === 0}
                className="w-full py-2.5 text-gray-500 hover:bg-gray-100 rounded-xl font-bold text-sm transition disabled:opacity-50 border border-gray-200"
              >
                Remove All Discounts
              </button>
            </div>
          </form>
        </div>

        {/* Product Selection List */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Select Products</h2>
            <button 
              onClick={toggleSelectAll}
              className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
            >
              {selectedIds.size === products.length && products.length > 0 ? (
                <><CheckSquare size={14} /> Deselect All</>
              ) : (
                <><Square size={14} /> Select All</>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {products.length === 0 ? (
              <p className="text-gray-500 text-center py-10 text-sm">No products found. Add products to start a promotion.</p>
            ) : (
              products.map((product) => {
                const isSelected = selectedIds.has(product._id);
                return (
                  <div 
                    key={product._id}
                    onClick={() => toggleSelect(product._id)}
                    className={`flex items-center gap-4 p-3 rounded-xl border transition cursor-pointer ${
                      isSelected ? 'border-orange-500 bg-orange-50/50' : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <div className="shrink-0 text-orange-500">
                      {isSelected ? <CheckSquare size={20} /> : <Square size={20} className="text-gray-300" />}
                    </div>
                    
                    <div className="w-12 h-12 rounded-lg bg-gray-50 overflow-hidden shrink-0 p-1 border border-gray-100">
                      <img src={product.imagePath || 'https://via.placeholder.com/100'} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{product.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-medium text-gray-500">₹{product.price}</span>
                        {product.discount_percent > 0 && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                            -{product.discount_percent}% OFF
                          </span>
                        )}
                        {product.promo_tag && (
                          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                            {product.promo_tag}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPromotions;
