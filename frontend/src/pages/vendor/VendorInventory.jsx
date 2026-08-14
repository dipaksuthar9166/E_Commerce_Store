import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Search,
  AlertTriangle,
  Package,
  Loader2,
  CheckCircle2,
  Trash2,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import { getProductImage, productHasImage } from '../../utils/productImage';
import {
  PageShell,
  PageHeader,
  RefreshButton,
  StatCard,
  SurfaceCard,
  CardHeader,
  fieldClass,
  labelClass,
  DataTable,
  TableHead,
  Th,
  TableBody,
  TableEmpty,
  TableSkeleton,
  tdClass,
  SoftBadge,
  PillTabs,
  AlertBanner,
  PrimaryButton,
  SecondaryButton,
} from '../../components/ui/PageUI';

const stockTone = (stock) => {
  if (stock <= 0)
    return {
      label: 'Out of stock',
      color: 'rose',
    };
  if (stock <= 5)
    return {
      label: 'Low stock',
      color: 'amber',
    };
  return {
    label: 'In stock',
    color: 'emerald',
  };
};

const VendorInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [drafts, setDrafts] = useState({});
  const [message, setMessage] = useState({ text: '', type: 'info' });
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((p) => selected.has(p._id));
  const someSelected = selected.size > 0;

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
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

  const handleDeleteOne = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/vendor/products/${product._id}`);
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
      setDrafts((d) => {
        const next = { ...d };
        delete next[product._id];
        return next;
      });
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(product._id);
        return next;
      });
      setMessage({ text: `"${product.name}" deleted.`, type: 'success' });
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to delete product.', type: 'error' });
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Inventory"
        subtitle="Track and update stock levels. Select products to delete in bulk."
        actions={<RefreshButton onClick={fetchProducts} loading={loading} />}
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total SKUs"
          value={loading ? '—' : stats.total}
          subtitle="In catalogue"
          icon={Package}
          iconColor="bg-indigo-50 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-400"
          bar="from-indigo-400 via-violet-400 to-fuchsia-500"
          delay={0}
        />
        <StatCard
          title="In Stock"
          value={loading ? '—' : stats.ok}
          subtitle="Healthy levels"
          icon={CheckCircle2}
          iconColor="bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400"
          bar="from-emerald-400 via-teal-400 to-cyan-400"
          delay={0.05}
        />
        <StatCard
          title="Low Stock"
          value={loading ? '—' : stats.low}
          subtitle="≤ 5 units"
          icon={AlertTriangle}
          iconColor="bg-amber-50 text-amber-500 dark:bg-amber-500/15 dark:text-amber-400"
          bar="from-amber-400 via-orange-400 to-rose-400"
          delay={0.1}
        />
        <StatCard
          title="Out of Stock"
          value={loading ? '—' : stats.out}
          subtitle="Needs restock"
          icon={Layers}
          iconColor="bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-400"
          bar="from-rose-400 via-pink-400 to-fuchsia-400"
          delay={0.15}
        />
      </div>

      {stats.out > 0 && (
        <AlertBanner icon={AlertTriangle} title="Stock alert" tone="amber">
          {stats.out} product{stats.out > 1 ? 's are' : ' is'} out of stock. Restock soon to avoid
          lost sales.
        </AlertBanner>
      )}

      <SurfaceCard delay={0.12}>
        <div className="flex flex-col xl:flex-row xl:items-end gap-4">
          <div className="flex-1 min-w-0">
            <label className={labelClass}>Search Inventory</label>
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, category, barcode..."
                className={`${fieldClass} pl-10 pr-4`}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Filter</label>
            <PillTabs
              tabs={[
                { key: 'all', label: 'All' },
                { key: 'low', label: 'Low' },
                { key: 'out', label: 'Out' },
              ]}
              value={filter}
              onChange={setFilter}
              counts={{ low: stats.low, out: stats.out }}
            />
          </div>
        </div>

        {someSelected && (
          <div className="mt-4 flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40">
            <div className="flex-1 text-sm font-semibold text-rose-700 dark:text-rose-300">
              {selected.size} item{selected.size > 1 ? 's' : ''} selected
            </div>
            <SecondaryButton onClick={() => setSelected(new Set())} className="!h-8 !text-xs !px-3">
              <X size={13} /> Clear
            </SecondaryButton>
            {confirmDelete ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                  Are you sure?
                </span>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteSelected}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-50"
                >
                  {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  Yes, Delete
                </button>
                <SecondaryButton onClick={() => setConfirmDelete(false)} className="!h-8 !text-xs !px-3">
                  Cancel
                </SecondaryButton>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition"
              >
                <Trash2 size={13} /> Delete Selected
              </button>
            )}
          </div>
        )}
      </SurfaceCard>

      {message.text && (
        <AlertBanner
          icon={message.type === 'success' ? CheckCircle2 : AlertTriangle}
          tone={message.type === 'success' ? 'emerald' : message.type === 'error' ? 'rose' : 'indigo'}
        >
          <div className="flex items-center justify-between gap-3">
            <span>{message.text}</span>
            <button
              type="button"
              onClick={() => setMessage({ text: '', type: 'info' })}
              className="opacity-60 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        </AlertBanner>
      )}

      <SurfaceCard padding={false} delay={0.18}>
        <CardHeader
          title="Stock Directory"
          subtitle={`${filtered.length} product${filtered.length !== 1 ? 's' : ''}`}
        />

        <DataTable minWidth="800px">
          <TableHead>
            <Th className="w-10">
              <input
                id="select-all-inventory"
                type="checkbox"
                checked={allFilteredSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </Th>
            <Th>Product</Th>
            <Th>Category</Th>
            <Th>Status</Th>
            <Th>Stock</Th>
            <Th className="text-right">Actions</Th>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeleton rows={5} colSpan={6} />
            ) : filtered.length === 0 ? (
              <TableEmpty
                icon={Package}
                title="No products in inventory"
                subtitle={
                  products.length === 0
                    ? 'Add products first, then manage stock here.'
                    : 'No matches for this filter.'
                }
                colSpan={6}
              />
            ) : (
              filtered.map((product, index) => {
                const stock = product.stock ?? 0;
                const tone = stockTone(stock);
                const dirty = String(stock) !== String(drafts[product._id] ?? '');
                const isChecked = selected.has(product._id);
                return (
                  <motion.tr
                    key={product._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                      isChecked ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                    }`}
                  >
                    <td className={tdClass}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOne(product._id)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center gap-3 min-w-[180px]">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                          {productHasImage(product) ? (
                            <img
                              src={getProductImage(product)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package size={16} className="text-slate-300 dark:text-slate-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {product.name}
                          </p>
                          {product.barcode && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                              {product.barcode}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={`${tdClass} text-slate-500 dark:text-slate-400`}>
                      {product.categoryName || product.categoryId?.name || '—'}
                    </td>
                    <td className={tdClass}>
                      <SoftBadge color={tone.color}>{tone.label}</SoftBadge>
                    </td>
                    <td className={tdClass}>
                      <input
                        type="number"
                        min="0"
                        value={drafts[product._id] ?? '0'}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [product._id]: e.target.value }))
                        }
                        className="w-24 h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={!dirty || savingId === product._id}
                          onClick={() => handleSaveStock(product)}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white text-xs font-bold transition"
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
                          className="inline-flex items-center p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </TableBody>
        </DataTable>

        {!loading && products.length === 0 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
            <Link to="/vendor/products">
              <PrimaryButton>
                <Package size={15} />
                Go to Products
              </PrimaryButton>
            </Link>
          </div>
        )}
      </SurfaceCard>
    </PageShell>
  );
};

export default VendorInventory;
