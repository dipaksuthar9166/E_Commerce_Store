import React, { useState, useEffect } from 'react';
import {
  Plus,
  Image as ImageIcon,
  Edit,
  Trash2,
  Loader2,
  Save,
  X,
  Link as LinkIcon,
  Type,
  ChevronsRight,
  Sparkles,
  ArrowRight,
  Eye,
} from 'lucide-react';
import api from '../../api/axios';

const THEMES = [
  { id: 0, label: 'Blue', bg: 'from-indigo-600 via-blue-600 to-sky-500', badge: 'bg-amber-400 text-amber-950', btn: 'bg-white text-indigo-700' },
  { id: 1, label: 'Pink', bg: 'from-rose-600 via-pink-600 to-orange-400', badge: 'bg-white text-rose-700', btn: 'bg-white text-rose-700' },
  { id: 2, label: 'Green', bg: 'from-emerald-600 via-teal-600 to-cyan-500', badge: 'bg-lime-300 text-emerald-900', btn: 'bg-white text-emerald-700' },
  { id: 3, label: 'Purple', bg: 'from-violet-700 via-purple-600 to-fuchsia-500', badge: 'bg-yellow-300 text-violet-900', btn: 'bg-white text-violet-700' },
  { id: 4, label: 'Dark', bg: 'from-slate-800 via-slate-700 to-blue-800', badge: 'bg-orange-400 text-slate-900', btn: 'bg-orange-400 text-slate-900' },
];

const FormInput = ({ label, icon: Icon, ...props }) => (
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
        className={`w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition ${Icon ? 'pl-10 pr-4' : 'px-4'}`}
      />
    </div>
  </div>
);

const LivePreview = ({ banner }) => {
  const theme = THEMES[(banner.theme ?? 0) % THEMES.length];
  const image = banner.imagePath;

  return (
    <div className={`relative w-full h-36 overflow-hidden rounded-xl bg-gradient-to-br ${theme.bg}`}>
      <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/15 blur-xl" />
      <div className="relative z-10 h-full flex items-center px-4 gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${theme.badge}`}>
            <Sparkles className="w-2.5 h-2.5" />
            {banner.buttonText || 'AD'}
          </span>
          <h3 className="text-white font-black text-sm leading-tight line-clamp-1">
            {banner.title || 'Your offer title'}
          </h3>
          <p className="text-white/80 text-[11px] line-clamp-1">
            {banner.subtitle || 'Short product pitch goes here'}
          </p>
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${theme.btn}`}>
            {banner.buttonText || 'Shop Now'}
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
        <div className="w-24 h-24 shrink-0 flex items-center justify-center">
          {image ? (
            <img
              src={image}
              alt="preview"
              className="max-w-full max-h-full object-contain drop-shadow-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
              <ImageIcon className="w-7 h-7 text-white/70" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const emptyBanner = () => ({
  title: '',
  subtitle: '',
  imagePath: '',
  buttonText: 'Shop Now',
  targetUrl: '/',
  theme: 0,
});

const VendorBanners = () => {
  const [banners, setBanners] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/banners/vendor');
      setBanners(data);
    } catch {
      setError('Failed to load banners.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (banner = null) => {
    setEditingBanner(banner ? { theme: 0, ...banner } : emptyBanner());
    setIsModalOpen(true);
    setError('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
    setError('');
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        title: editingBanner.title,
        subtitle: editingBanner.subtitle,
        imagePath: editingBanner.imagePath,
        buttonText: editingBanner.buttonText || 'Shop Now',
        targetUrl: editingBanner.targetUrl || '/',
        theme: editingBanner.theme ?? 0,
      };

      if (editingBanner._id) {
        const { data: updatedBanner } = await api.put(`/banners/${editingBanner._id}`, payload);
        setBanners(banners.map((b) => (b._id === updatedBanner._id ? updatedBanner : b)));
      } else {
        const { data: newBanner } = await api.post('/banners', payload);
        setBanners([newBanner, ...banners]);
      }
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save banner.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      await api.delete(`/banners/${id}`);
      setBanners(banners.filter((b) => b._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete banner.');
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Ads & Banners</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Create modern product advertisements for the customer home page — like Flipkart / Meesho style promos.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm shadow-sm transition-colors self-start"
        >
          <Plus size={17} /> Create Ad
        </button>
      </div>

      {/* Tips */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-900">
        <p className="font-semibold mb-1">How good ads work</p>
        <ul className="list-disc list-inside text-blue-800/90 space-y-0.5 text-xs sm:text-sm">
          <li>Use a clear product photo (PNG / white background works best)</li>
          <li>Short catchy title: e.g. “Sneaker Fest · 50% OFF”</li>
          <li>One benefit in subtitle: price, free delivery, or limited stock</li>
          <li>Link Target URL to your shop or product page</li>
        </ul>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl bg-gray-50">
          <ImageIcon size={40} className="mx-auto text-gray-300 mb-2" />
          <h3 className="font-bold text-gray-800">No product ads yet</h3>
          <p className="text-sm text-gray-500 mb-4">Create your first modern product advertisement.</p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium"
          >
            <Plus size={16} /> Create Ad
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((banner, index) => {
            const theme = THEMES[(banner.theme ?? index) % THEMES.length];
            const bgImg = banner.imagePath || banner.bannerImage || banner.image;
            return (
              <div
                key={banner._id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
              >
                <div className={`relative w-full h-44 bg-gradient-to-br ${theme.bg} flex items-center px-5 gap-4`}>
                  <div className="flex-1 min-w-0 space-y-1.5 text-white">
                    <span className={`inline-flex text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${theme.badge}`}>
                      {banner.buttonText || 'Ad'}
                    </span>
                    <h2 className="text-lg font-black leading-tight line-clamp-2">{banner.title}</h2>
                    <p className="text-xs text-white/85 line-clamp-2">{banner.subtitle}</p>
                  </div>
                  {bgImg && (
                    <img
                      src={bgImg}
                      alt={banner.title}
                      className="w-28 h-28 object-contain drop-shadow-xl shrink-0"
                    />
                  )}
                  <span
                    className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                      banner.status === 'approved'
                        ? 'bg-green-500 text-white'
                        : banner.status === 'rejected'
                          ? 'bg-red-500 text-white'
                          : 'bg-yellow-400 text-yellow-950'
                    }`}
                  >
                    {banner.status || 'Pending'}
                  </span>
                </div>
                <div className="p-3 flex justify-between items-center bg-gray-50 border-t mt-auto">
                  <span className="text-xs text-gray-400 truncate max-w-[200px]">
                    {banner.targetUrl || 'No redirect URL'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(banner)}
                      className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteBanner(banner._id)}
                      className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && editingBanner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b flex items-center justify-between">
              <div>
                <h2 className="text-gray-900 font-bold text-lg">
                  {editingBanner._id ? 'Edit Product Ad' : 'Create Product Ad'}
                </h2>
                <p className="text-gray-400 text-xs mt-0.5">
                  Looks like modern app ads on the customer home page.
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {error && (
                <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>
              )}

              {/* Live preview */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2">
                  <Eye size={14} /> Live preview
                </div>
                <LivePreview banner={editingBanner} />
              </div>

              <FormInput
                label="Headline *"
                icon={Type}
                type="text"
                required
                placeholder="e.g. Nike Air · 40% OFF"
                value={editingBanner.title || ''}
                onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
              />
              <FormInput
                label="Offer line"
                icon={ChevronsRight}
                type="text"
                placeholder="e.g. Free delivery · From ₹1,999 only"
                value={editingBanner.subtitle || ''}
                onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
              />
              <FormInput
                label="Product image URL *"
                icon={ImageIcon}
                type="text"
                required
                placeholder="https://... product photo (not full desktop wallpaper)"
                value={editingBanner.imagePath || ''}
                onChange={(e) => setEditingBanner({ ...editingBanner, imagePath: e.target.value })}
              />

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ad theme color</label>
                <div className="flex flex-wrap gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setEditingBanner({ ...editingBanner, theme: t.id })}
                      className={`h-9 w-9 rounded-full bg-gradient-to-br ${t.bg} ring-offset-2 transition ${
                        (editingBanner.theme ?? 0) === t.id ? 'ring-2 ring-blue-600 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      title={t.label}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Button text"
                  icon={Type}
                  type="text"
                  placeholder="Shop Now"
                  value={editingBanner.buttonText || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, buttonText: e.target.value })}
                />
                <FormInput
                  label="Target URL"
                  icon={LinkIcon}
                  type="text"
                  placeholder="/ or /shop/..."
                  value={editingBanner.targetUrl || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, targetUrl: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-2.5 rounded-lg border text-gray-600 font-medium text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium text-sm shadow-sm flex items-center justify-center gap-2 transition"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={15} />}
                  {submitting ? 'Saving...' : 'Publish Ad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorBanners;
