import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  X,
  Tag,
  Package,
  Layers,
  AlertTriangle,
  ImageIcon,
  Edit,
  Barcode,
  Save,
  Loader2,
  ShoppingBag,
  IndianRupee,
  Percent,
  Palette,
  ScanLine,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  Camera,
  Upload,
} from 'lucide-react';
import api from '../../api/axios';
import BulkUploadModal from '../../components/vendor/BulkUploadModal';
import CameraScannerModal from '../../components/vendor/CameraScannerModal';

const StockBadge = ({ stock }) => {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-red-50 text-red-600 border border-red-100">
        <AlertTriangle size={9} /> Out of Stock
      </span>
    );
  }
  if (stock <= 5) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-100">
        Low: {stock}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-green-50 text-green-600 border border-green-100">
      In Stock ({stock})
    </span>
  );
};

const SkeletonCard = () => (
  <div className="animate-pulse bg-white rounded-xl p-3 border border-gray-100 h-16" />
);

const FormInput = ({ label, icon: Icon, error, ...props }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Icon size={15} />
        </div>
      )}
      <input
        {...props}
        className={`w-full bg-gray-50 border ${error ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-blue-500'} rounded-lg py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-blue-500 transition ${Icon ? 'pl-10 pr-4' : 'px-4'}`}
      />
    </div>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const emptyProduct = () => ({
  name: '',
  price: '',
  stock: '1',
  colors: '',
  sizes: '',
  description: '',
  barcode: '',
  categoryId: '',
  categoryName: '',
  imagePath: '',
  autoFilled: false,
  lookupSource: '',
});

const VendorProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promotingProduct, setPromotingProduct] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupMsg, setLookupMsg] = useState('');
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Focus barcode field when opening add modal
  useEffect(() => {
    if (isModalOpen && editingProduct && !editingProduct._id) {
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    }
  }, [isModalOpen, editingProduct?._id]);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/vendor/products');
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/vendor/categories');
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories', error);
    }
  };

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      p.categoryName?.toLowerCase().includes(term) ||
      p.category?.toLowerCase().includes(term) ||
      p.barcode?.toLowerCase().includes(term)
    );
  });

  const handleOpenModal = (product = null) => {
    setEditingProduct(
      product
        ? {
            ...product,
            colors: Array.isArray(product.colors) ? product.colors.join(', ') : '',
            sizes: Array.isArray(product.sizes) ? product.sizes.join(', ') : '',
            categoryId: product.categoryId?._id || product.categoryId || '',
            categoryName: product.categoryName || product.categoryId?.name || '',
            autoFilled: false,
            lookupSource: '',
          }
        : emptyProduct()
    );
    setErrors({});
    setLookupMsg('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setLookupMsg('');
    setImageFile(null);
  };

  const handleOpenPromoModal = (product) => {
    setPromotingProduct({
      _id: product._id,
      promo_tag: product.promo_tag || '',
      discount_percent: product.discount_percent || 0,
    });
    setIsPromoModalOpen(true);
  };

  const handleClosePromoModal = () => setIsPromoModalOpen(false);

  /** Scan/enter barcode → auto-fill name, image, description, category */
  const handleBarcodeLookup = async (codeOverride) => {
    const code = String(codeOverride ?? editingProduct?.barcode ?? '')
      .replace(/\s+/g, '')
      .trim();

    if (!code || code.length < 6) {
      setLookupMsg('Enter or scan a valid barcode (6+ digits).');
      return;
    }

    setLookingUp(true);
    setLookupMsg('');
    setErrors({});

    try {
      const { data } = await api.get(`/vendor/products/lookup/${encodeURIComponent(code)}`);

      if (data.alreadyListed) {
        setLookupMsg(
          `You already listed this barcode as "${data.alreadyListed.name}". Opening edit...`
        );
        // Open existing product for stock/price update
        const existing = products.find((p) => p._id === data.alreadyListed._id);
        if (existing) {
          handleOpenModal(existing);
          setLookingUp(false);
          return;
        }
      }

      if (!data.found) {
        setEditingProduct((prev) => ({
          ...prev,
          barcode: code,
          autoFilled: false,
          lookupSource: '',
        }));
        setLookupMsg(data.message || 'Not found online. Fill details manually.');
        return;
      }

      // Auto-create category match: if category name returned but no categoryId, keep categoryName for backend
      let categoryId = data.categoryId || '';
      if (!categoryId && data.category) {
        const match = categories.find(
          (c) => c.name?.toLowerCase() === data.category.toLowerCase()
        );
        if (match) categoryId = match._id;
      }

      setEditingProduct((prev) => ({
        ...prev,
        barcode: data.barcode || code,
        name: data.name || prev.name,
        description: data.description || prev.description,
        imagePath: data.imagePath || prev.imagePath,
        colors: data.color ? [data.color].join(', ') : (prev.colors || ''),
        categoryId,
        categoryName: data.category || prev.categoryName || '',
        autoFilled: true,
        lookupSource: data.source || 'catalog',
        // keep price/stock if vendor already typed them
        price: prev.price || '',
        stock: prev.stock || '1',
      }));

      setLookupMsg(
        `Auto-filled from ${data.source === 'database' ? 'your catalogue' : 'barcode database'}. Set price & stock, then save.`
      );

      // Refresh categories if we might auto-create on save
      if (data.category && !categoryId) {
        // keep categoryName so backend creates it
      }
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        (error.code === 'ERR_NETWORK'
          ? 'Cannot reach server for barcode lookup.'
          : 'Lookup failed. Try again or fill manually.');
      setLookupMsg(msg);
      setEditingProduct((prev) => ({ ...prev, barcode: code }));
    } finally {
      setLookingUp(false);
    }
  };

  const handleBarcodeKeyDown = (e) => {
    // USB barcode scanners type digits then send Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarcodeLookup(e.target.value);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const formData = new FormData();
    formData.append('name', editingProduct.name);
    formData.append('price', Number(editingProduct.price));
    formData.append('stock', Number(editingProduct.stock));
    formData.append('description', editingProduct.description || '');
    formData.append('barcode', editingProduct.barcode || '');
    
    if (editingProduct.categoryId) {
      formData.append('categoryId', editingProduct.categoryId);
    } else if (editingProduct.categoryName) {
      formData.append('categoryName', editingProduct.categoryName);
    }
    
    if (editingProduct.colors) formData.append('colors', editingProduct.colors);
    if (editingProduct.sizes) formData.append('sizes', editingProduct.sizes);
    
    if (editingProduct.imagePath && !imageFile) {
      formData.append('imagePath', editingProduct.imagePath);
    }
    
    formData.append('skipAiImage', Boolean(editingProduct.imagePath || imageFile));

    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      if (editingProduct._id) {
        const { data: updatedProduct } = await api.put(
          `/vendor/products/${editingProduct._id}`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        setProducts(products.map((p) => (p._id === updatedProduct._id ? updatedProduct : p)));
      } else {
        const { data: newProd } = await api.post('/vendor/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setProducts([newProd, ...products]);
        // categories may have been auto-created
        fetchCategories();
      }
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save product', error);
      setErrors({
        form: error.response?.data?.message || 'Failed to save product. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePromotion = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: updatedProduct } = await api.put(
        `/vendor/products/${promotingProduct._id}/promo`,
        {
          promo_tag: promotingProduct.promo_tag,
          discount_percent: Number(promotingProduct.discount_percent),
        }
      );
      setProducts(products.map((p) => (p._id === updatedProduct._id ? updatedProduct : p)));
      handleClosePromoModal();
    } catch (error) {
      console.error('Failed to save promotion', error);
      setErrors({
        promo: error.response?.data?.message || 'Failed to save promotion. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {loading
              ? 'Loading...'
              : `${products.length} product${products.length === 1 ? '' : 's'} in your catalogue`}
          </p>
          <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
            <ScanLine size={12} />
            Scan barcode to auto-fill name, image &amp; details — only set price &amp; stock
          </p>
        </div>
        <div className="flex gap-2 self-start">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm shadow-sm transition-colors"
          >
            <FileSpreadsheet size={17} />
            Bulk Upload
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-400 hover:bg-orange-500 text-white font-medium text-sm shadow-sm transition-colors"
          >
            <Plus size={17} />
            Add Product
          </button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search name, category, barcode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Barcode
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan="6">
                      <SkeletonCard />
                    </td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <ShoppingBag size={36} className="text-gray-300 mb-3" />
                      <h3 className="font-bold text-gray-800 text-lg mb-1">
                        {searchTerm ? 'No products found' : 'No products yet'}
                      </h3>
                      <p className="text-gray-400 text-sm max-w-xs mb-4">
                        {searchTerm
                          ? `No results for "${searchTerm}". Try a different keyword.`
                          : 'Scan a product barcode to auto-fill details and start selling.'}
                      </p>
                      {!searchTerm && (
                        <button
                          onClick={() => handleOpenModal()}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                        >
                          <Barcode size={16} />
                          Scan / Add by barcode
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {product.imagePath ? (
                            <img
                              src={product.imagePath}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package size={20} className="text-gray-300" />
                          )}
                        </div>
                        <div>
                          <span>{product.name}</span>
                          {product.promo_tag && (
                            <span className="ml-2 text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md border border-orange-200">
                              {product.promo_tag}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                      {product.barcode || '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {product.categoryName || product.categoryId?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      ₹{Number(product.price).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StockBadge stock={product.stock} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenModal(product)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleOpenPromoModal(product)}
                        className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        <Tag size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BulkUploadModal 
        isOpen={isBulkModalOpen} 
        onClose={() => setIsBulkModalOpen(false)} 
        onUploadSuccess={fetchProducts} 
      />

      {/* Add / Edit Product Modal */}
      {isModalOpen && editingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-gray-900 font-bold text-lg">
                  {editingProduct._id ? 'Edit Product' : 'Add Product'}
                </h2>
                <p className="text-gray-400 text-xs mt-0.5">
                  {editingProduct._id
                    ? 'Update product details'
                    : 'Scan barcode → auto-fill → set price & stock'}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {errors.form && (
                <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{errors.form}</p>
              )}

              {/* ── Barcode scan zone ── */}
              {!editingProduct._id && (
                <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-blue-700">
                    <ScanLine size={18} />
                    <span className="text-sm font-bold">Barcode auto-fill</span>
                  </div>
                  <p className="text-[11px] text-blue-600/80">
                    USB scanner se scan karo (auto Enter) ya code type karke Lookup dabao.
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Barcode
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400"
                      />
                      <input
                        ref={barcodeInputRef}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="Scan or type barcode..."
                        value={editingProduct.barcode || ''}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            barcode: e.target.value,
                            autoFilled: false,
                          })
                        }
                        onKeyDown={handleBarcodeKeyDown}
                        className="w-full pl-10 pr-3 py-2.5 bg-white border border-blue-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={lookingUp}
                      onClick={() => handleBarcodeLookup()}
                      className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center gap-1.5 shrink-0"
                    >
                      {lookingUp ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Sparkles size={16} />
                      )}
                      {lookingUp ? '...' : 'Lookup'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCameraModalOpen(true)}
                      className="px-3 py-2.5 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-blue-600 text-sm font-semibold flex items-center gap-1.5 shrink-0"
                    >
                      <ScanLine size={16} />
                      <span className="hidden sm:inline">Scan Barcode</span>
                    </button>
                  </div>
                  {lookupMsg && (
                    <p
                      className={`text-xs flex items-start gap-1.5 ${
                        editingProduct.autoFilled ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {editingProduct.autoFilled ? (
                        <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                      ) : null}
                      {lookupMsg}
                    </p>
                  )}
                </div>
              )}

              {editingProduct._id && (
                <FormInput
                  label="Barcode"
                  icon={Barcode}
                  type="text"
                  placeholder="Optional"
                  value={editingProduct.barcode || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, barcode: e.target.value })
                  }
                />
              )}

              {/* Preview when auto-filled */}
              {editingProduct.imagePath && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border border-gray-200 shrink-0">
                    <img
                      src={editingProduct.imagePath}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {editingProduct.name || 'Product image'}
                    </p>
                    {editingProduct.autoFilled && (
                      <p className="text-[11px] text-emerald-600 font-medium">
                        Image from barcode database
                      </p>
                    )}
                  </div>
                </div>
              )}

              <FormInput
                label="Product Name"
                icon={Package}
                type="text"
                required
                placeholder="Auto-filled from barcode"
                value={editingProduct.name}
                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormInput
                  label="Price (₹) *"
                  icon={IndianRupee}
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="Your selling price"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                />
                <FormInput
                  label="Stock Qty *"
                  icon={Layers}
                  type="number"
                  required
                  min="0"
                  value={editingProduct.stock}
                  onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormInput
                  label="Colors (comma-separated)"
                  icon={Palette}
                  type="text"
                  placeholder="e.g. Red, Blue, Green"
                  value={editingProduct.colors || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, colors: e.target.value })}
                />
                <FormInput
                  label="Sizes (comma-separated)"
                  icon={Layers}
                  type="text"
                  placeholder="e.g. S, M, L, XL"
                  value={editingProduct.sizes || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, sizes: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Category
                </label>
                <select
                    value={editingProduct.categoryId || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        categoryId: e.target.value,
                        categoryName: '',
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">
                      {editingProduct.categoryName
                        ? `Auto: ${editingProduct.categoryName}`
                        : 'Select category'}
                    </option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {!editingProduct.categoryId && editingProduct.categoryName && (
                    <p className="text-[10px] text-blue-600 mt-1">
                      Will create category &quot;{editingProduct.categoryName}&quot; on save
                    </p>
                  )}
                  {categories.length === 0 && !editingProduct.categoryName && (
                    <p className="text-xs text-amber-600 mt-1">
                      No categories yet.{' '}
                      <Link
                        to="/vendor/categories"
                        className="font-semibold underline"
                        onClick={handleCloseModal}
                      >
                        Create one
                      </Link>{' '}
                      or scan barcode (auto category).
                    </p>
                  )}
                </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Auto-filled from barcode when available"
                  value={editingProduct.description || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Product Image
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer flex flex-col items-center justify-center py-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                    <Upload size={18} className="text-gray-400 mb-1.5" />
                    <span className="text-[11px] text-gray-500 font-medium">Upload / Capture Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setImageFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                  {imageFile && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-white group">
                      <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={(e) => { e.preventDefault(); setImageFile(null); }} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  )}
                </div>
                {!editingProduct.imagePath && !editingProduct._id && !imageFile && (
                  <p className="text-[10px] text-gray-500 flex items-center gap-1.5 pt-2">
                    <ImageIcon size={12} />
                    Auto-Search image will be applied on save if left empty.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-medium text-sm shadow-sm transition flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={15} />}
                  {submitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPromoModalOpen && promotingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={handleClosePromoModal}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-gray-900 font-bold text-lg">Set Promotion</h2>
                <p className="text-gray-400 text-xs mt-0.5">Add a discount or tag to your product</p>
              </div>
              <button
                onClick={handleClosePromoModal}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSavePromotion} className="p-6 space-y-4">
              {errors.promo && (
                <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{errors.promo}</p>
              )}
              <FormInput
                label="Promotion Tag"
                icon={Tag}
                type="text"
                placeholder="e.g. 50% OFF, BOGO"
                value={promotingProduct.promo_tag}
                onChange={(e) =>
                  setPromotingProduct({ ...promotingProduct, promo_tag: e.target.value })
                }
              />
              <FormInput
                label="Discount Percentage (%)"
                icon={Percent}
                type="number"
                placeholder="e.g. 10 for 10%"
                value={promotingProduct.discount_percent}
                onChange={(e) =>
                  setPromotingProduct({
                    ...promotingProduct,
                    discount_percent: e.target.value,
                  })
                }
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClosePromoModal}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium text-sm shadow-sm transition flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={15} />}
                  {submitting ? 'Saving...' : 'Save Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <CameraScannerModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onScan={(code) => {
          setEditingProduct({ ...editingProduct, barcode: code });
          handleBarcodeLookup(code);
        }}
      />
    </div>
  );
};

export default VendorProducts;
