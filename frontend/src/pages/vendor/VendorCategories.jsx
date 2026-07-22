import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Plus, Package, Loader2, Layers } from 'lucide-react';
import api from '../../api/axios';
import { vendorProductCategoryNames } from '../../data/customerCategories';

const VendorCategories = () => {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/vendor/categories');
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      setError('Category name is required');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/vendor/categories', { name });
      setCategories((prev) => {
        const exists = prev.some((c) => c._id === data._id);
        return exists ? prev : [data, ...prev];
      });
      setNewName('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAdd = async (name) => {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/vendor/categories', { name });
      setCategories((prev) => {
        const exists = prev.some((c) => c._id === data._id);
        return exists ? prev : [data, ...prev];
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add category');
    } finally {
      setSubmitting(false);
    }
  };

  const existingNames = new Set(categories.map((c) => c.name.toLowerCase()));
  const missingDefaults = vendorProductCategoryNames.filter(
    (name) => !existingNames.has(name.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          You control marketplace categories. Customer app shows only real categories that have products.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 space-y-2">
        <p className="font-semibold">Who handles this? → You (Vendor / Seller)</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-900/90">
          <li>
            <strong>Create category</strong> here (e.g. Grocery, Electronics, Fashion)
          </li>
          <li>
            <strong>Assign products</strong> in{' '}
            <Link to="/vendor/products" className="font-semibold underline hover:text-blue-900">
              My Products
            </Link>{' '}
            → pick this category
          </li>
          <li>
            Customer sidebar + home chips update automatically (same name from other sellers merges)
          </li>
        </ol>
        <p className="text-xs text-blue-700/80">
          Empty categories (no products yet) stay hidden from customers until you add at least one product.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add category */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus size={18} className="text-blue-500" />
            Add Category
          </h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category Name</label>
              <div className="relative">
                <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Grocery, Stationery Hub"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-medium text-sm transition-colors"
            >
              {submitting ? 'Adding...' : 'Create Category'}
            </button>
          </form>

          {missingDefaults.length > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-2">Quick add platform categories</p>
              <div className="flex flex-wrap gap-2">
                {missingDefaults.map((name) => (
                  <button
                    key={name}
                    type="button"
                    disabled={submitting}
                    onClick={() => handleQuickAdd(name)}
                    className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors disabled:opacity-50"
                  >
                    + {name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Your categories list */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Layers size={18} className="text-orange-500" />
            Your Categories ({categories.length})
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Tag className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No categories yet. Add one to get started.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Tag size={14} className="text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-900 text-sm">{cat.name}</span>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-100">
                    <Package size={12} />
                    {cat.productCount ?? 0} products
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Platform category reference */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-3">Customer Sidebar Tabs</h2>
        <p className="text-sm text-gray-500 mb-4">
          These tabs appear on the customer app. Use matching category names so your products show up correctly.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {vendorProductCategoryNames.map((name) => {
            const hasCategory = existingNames.has(name.toLowerCase());
            return (
              <div
                key={name}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium border ${
                  hasCategory
                    ? 'bg-green-50 border-green-100 text-green-700'
                    : 'bg-gray-50 border-gray-100 text-gray-600'
                }`}
              >
                {name}
                {hasCategory && <span className="block text-[10px] font-normal mt-0.5">Added</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VendorCategories;
