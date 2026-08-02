import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Search,
  AlertTriangle,
  Package,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Trash2,
  X,
} from 'lucide-react';
import api from '../../api/axios';
import { getProductImage, productHasImage } from '../../utils/productImage';

const stockTone = (stock) => {
  if (stock <= 0) return { label: 'Out of stock', cls: 'bg-red-50 text-red-700 border-red-100' };
  if (stock <= 5) return { label: 'Low stock', cls: 'bg-amber-50 text-amber-700 border-amber-100' };
  return { label: 'In stock', cls: 'bg-green-50 text-green-700 border-green-100' };
};

const VendorInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | low | out
  const [drafts, setDrafts] = useState({});
  const [message, setMessage] = useState({ text: '', type: 'info' });

  // Selection state
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false); // show confirm dialog

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/vendor/products');
      const list = Array.isArray(data) ? data : [];
      setProducts(list);
      const next = {};
      list.forEach((p) => {
        next[p._id] = String(p.stock ?? 0);
      });
      setDrafts(next);
      setSelected(new Set());
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const stats = useMemo(() => {
    const total = products.length;
    const out = products.filter((p) => (p.stock ?? 0) <= 0).length;
    const low = products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5).length;
    const ok = total - out - low;
    return { total, out, low, ok };
  }, [products]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      const stock = p.stock ?? 0;
      if (filter === 'out' && stock > 0) return false;
      if (filter === 'low' && !(stock > 0 && stock <= 5)) return false;
      if (!term) return true;
      return (
        p.name?.toLowerCase().includes(term) ||
        p.categoryName?.toLowerCase().includes(term) ||
        p.categoryId?.name?.toLowerCase().includes(term) ||
        p.barcode?.toLowerCase().includes(term)
      );
    });
  }, [products, search, filter]);

  // ── Selection helpers ────────────────────────────────────────────────────────
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((p) => selected.has(p._id));
  const someSelected = selected.size > 0;

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      // deselect all currently filtered
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((p) => next.delete(p._id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((p) => next.add(p._id));
        return next;
      });
    }
  };

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Save stock ───────────────────────────────────────────────────────────────
  const handleSaveStock = async (product) => {
    const raw = drafts[product._id];
    const stock = Math.max(0, parseInt(raw, 10));
    if (Number.isNaN(stock)) {
      setMessage({ text: 'Enter a valid stock number.', type: 'error' });
      return;
    }

    setSavingId(product._id);
    setMessage({ text: '', type: 'info' });
    try {
      const payload = {
        name: product.name,
        price: product.price,
        stock,
        description: product.description || '',
        barcode: product.barcode || '',
        categoryId: product.categoryId?._id || product.categoryId || undefined,
      };
      const { data: updated } = await api.put(`/vendor/products/${product._id}`, payload);
      setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      setDrafts((d) => ({ ...d, [product._id]: String(updated.stock ?? stock) }));
      setMessage({ text: `Stock updated for "${product.name}".`, type: 'success' });
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to update stock.', type: 'error' });
    } finally {
      setSavingId(null);
    }
  };

  // ── Delete selected ──────────────────────────────────────────────────────────
  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    setDeleting(true);
    setConfirmDelete(false);
    try {
      const ids = [...selected];
      await api.delete('/vendor/products/bulk', { data: { ids } });
      setProducts((prev) => prev.filter((p) => !selected.has(p._id)));
      setDrafts((d) => {
        const next = { ...d };
        ids.forEach((id) => delete next[id]);
        return next;
      });
      setSelected(new Set());
      setMessage({ text: `${ids.length} product(s) deleted successfully.`, type: 'success' });
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to delete products.', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // ── Delete single ────────────────────────────────────────────────────────────
  const handleDeleteOne = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/vendor/products/${product._id}`);
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
      setDrafts((d) => { const next = { ...d }; delete next[product._id]; return next; });
      setSelected((prev) => { const next = new Set(prev); next.delete(product._id); return next; });
      setMessage({ text: `"${product.name}" deleted.`, type: 'success' });
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to delete product.', type: 'error' });
    }
  };

  const msgCls =
    message.type === 'success'
      ? 'bg-green-50 border-green-100 text-green-800'
      : message.type === 'error'
      ? 'bg-red-50 border-red-100 text-red-700'
      : 'bg-blue-50 border-blue-100 text-blue-800';

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Track and update stock levels. Select products to delete in bulk.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchProducts}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 self-start"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total SKUs', value: stats.total, icon: Package, tone: 'bg-blue-50 text-blue-600' },
          { label: 'In stock', value: stats.ok, icon: CheckCircle2, tone: 'bg-green-50 text-green-600' },
          { label: 'Low stock', value: stats.low, icon: AlertTriangle, tone: 'bg-amber-50 text-amber-600' },
          { label: 'Out of stock', value: stats.out, icon: Layers, tone: 'bg-red-50 text-red-600' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${tone}`}>
              <Icon size={18} />
            </div>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters + Bulk Delete Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, category, barcode..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All' },
              { key: 'low', label: 'Low' },
              { key: 'out', label: 'Out' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                  filter === key
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Action Bar — shown when items are selected */}
        {someSelected && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
            <div className="flex-1 text-sm font-semibold text-red-700">
              {selected.size} item{selected.size > 1 ? 's' : ''} selected
            </div>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition"
            >
              <X size={13} /> Clear
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-red-700">Are you sure?</span>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteSelected}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50"
                >
                  {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition"
              >
                <Trash2 size={13} /> Delete Selected
              </button>
            )}
          </div>
        )}
      </div>

      {/* Message banner */}
      {message.text && (
        <div className={`flex items-center justify-between text-sm border rounded-lg px-4 py-2.5 ${msgCls}`}>
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage({ text: '', type: 'info' })}
            className="ml-3 text-current opacity-60 hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Package size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="font-semibold text-gray-800">No products in inventory</p>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              {products.length === 0 ? 'Add products first, then manage stock here.' : 'No matches for this filter.'}
            </p>
            {products.length === 0 && (
              <Link
                to="/vendor/products"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium"
              >
                Go to Products
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {/* Select All checkbox */}
                  <th className="px-4 py-3 text-left w-10">
                    <input
                      id="select-all-inventory"
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Product</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Stock</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((product) => {
                  const stock = product.stock ?? 0;
                  const tone = stockTone(stock);
                  const dirty = String(stock) !== String(drafts[product._id] ?? '');
                  const isChecked = selected.has(product._id);
                  return (
                    <tr
                      key={product._id}
                      className={`hover:bg-gray-50/60 transition-colors ${isChecked ? 'bg-red-50/40' : ''}`}
                    >
                      {/* Row checkbox */}
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOne(product._id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3 min-w-[180px]">
                          <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                            {productHasImage(product) ? (
                              <img src={getProductImage(product)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package size={16} className="text-gray-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                            {product.barcode && (
                              <p className="text-[11px] text-gray-400 font-mono">{product.barcode}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {product.categoryName || product.categoryId?.name || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold border ${tone.cls}`}>
                          {tone.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <input
                          type="number"
                          min="0"
                          value={drafts[product._id] ?? '0'}
                          onChange={(e) =>
                            setDrafts((d) => ({ ...d, [product._id]: e.target.value }))
                          }
                          className="w-24 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={!dirty || savingId === product._id}
                            onClick={() => handleSaveStock(product)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-semibold transition"
                          >
                            {savingId === product._id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : null}
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOne(product)}
                            title="Delete product"
                            className="inline-flex items-center p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorInventory;
