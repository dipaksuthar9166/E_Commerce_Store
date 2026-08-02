import React, { useState, useEffect } from 'react';
import {
  Settings,
  Percent,
  Truck,
  Save,
  Image,
  AlertTriangle,
  Trash2,
  History,
  ShieldAlert,
} from 'lucide-react';
import api from '../../api/axios';

const AdminSettings = () => {
  const [commission, setCommission] = useState(10);
  const [riderFee, setRiderFee] = useState(40);
  const [saved, setSaved] = useState(false);

  const defaultBanners = [
    { title: 'Summer Sale', image: 'https://via.placeholder.com/800x400', link: '/category/summer' },
    { title: 'New Arrivals', image: 'https://via.placeholder.com/800x400', link: '/category/new' },
  ];
  const [bannersJson, setBannersJson] = useState(JSON.stringify(defaultBanners, null, 2));

  // Danger zone / reset state
  const [resetMode, setResetMode] = useState('history'); // 'history' | 'full'
  const [confirmText, setConfirmText] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState(null);
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await api.get('/admin/config');
        if (data) {
          if (data.commissionRate) setCommission(data.commissionRate);
          if (data.banners) setBannersJson(JSON.stringify(data.banners, null, 2));
        }
      } catch (err) {
        console.error('Failed to fetch config', err);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let parsedBanners = [];
      try {
        parsedBanners = JSON.parse(bannersJson);
      } catch {
        alert('Invalid JSON in Banners field');
        return;
      }
      await api.put('/admin/config', {
        commissionRate: Number(commission),
        banners: parsedBanners,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Failed to save config');
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetResult(null);

    if (confirmText !== 'RESET') {
      setResetError('Confirmation text must be exactly RESET (all caps).');
      return;
    }
    if (!resetPassword) {
      setResetError('Enter your admin password to continue.');
      return;
    }

    const modeLabel =
      resetMode === 'history'
        ? 'ALL ORDER HISTORY'
        : 'EVERYTHING (orders, products, shops, coupons, banners, non-admin users)';

    const ok = window.confirm(
      `⚠️ This cannot be undone.\n\nYou are about to permanently delete:\n${modeLabel}\n\nContinue?`
    );
    if (!ok) return;

    setResetting(true);
    try {
      const { data } = await api.post('/admin/reset-data', {
        mode: resetMode,
        confirmText: 'RESET',
        password: resetPassword,
      });
      setResetResult(data);
      setConfirmText('');
      setResetPassword('');
    } catch (err) {
      setResetError(err.response?.data?.message || 'Reset failed. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <Settings className="text-slate-700" /> Platform Settings
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Configure platform parameters, commissions, and rider payouts
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Platform Commission (%)
          </label>
          <div className="relative">
            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="number"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              className="pl-10 block w-full border border-gray-200 rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 bg-gray-50 transition"
              required
            />
          </div>
          <span className="text-[10px] text-gray-400 mt-1.5 block">
            Standard fee charged on all shop sales (gross amount).
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Rider Flat Payout (₹)
          </label>
          <div className="relative">
            <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="number"
              value={riderFee}
              onChange={(e) => setRiderFee(e.target.value)}
              className="pl-10 block w-full border border-gray-200 rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 bg-gray-50 transition"
              required
            />
          </div>
          <span className="text-[10px] text-gray-400 mt-1.5 block">
            Fixed fee paid to delivery boy per successful delivery.
          </span>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Image className="h-4 w-4" /> Homepage Advertisement Banners (JSON)
          </label>
          <textarea
            rows={7}
            value={bannersJson}
            onChange={(e) => setBannersJson(e.target.value)}
            className="block w-full border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500 bg-gray-50 transition font-mono whitespace-pre"
          />
          <span className="text-[10px] text-gray-400 mt-1.5 block">
            Update the banner array with title, image, and link properties to display on the homepage.
          </span>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-sm shadow-md transition"
        >
          <Save size={16} /> Save Configuration
        </button>

        {saved && (
          <p className="text-center text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg p-2 animate-pulse">
            Configuration saved successfully! All transactions will process with updated rates.
          </p>
        )}
      </form>

      {/* Danger Zone — Platform Reset */}
      <div className="bg-white border-2 border-red-200 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-red-50 text-red-600">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-red-700 flex items-center gap-2">
              <AlertTriangle size={18} /> Danger Zone
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Permanently reset platform data. This action cannot be undone. Admin accounts and
              global settings are always kept.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleReset}
          className="space-y-4"
          autoComplete="off"
          data-form-type="other"
        >
          {/* Trap browser password-manager autofill (email/username) */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            tabIndex={-1}
            aria-hidden="true"
            value=""
            readOnly
            className="absolute opacity-0 pointer-events-none h-0 w-0 overflow-hidden"
          />
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            tabIndex={-1}
            aria-hidden="true"
            value=""
            readOnly
            className="absolute opacity-0 pointer-events-none h-0 w-0 overflow-hidden"
          />

          {/* Mode selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setResetMode('history')}
              className={`text-left p-4 rounded-2xl border-2 transition ${
                resetMode === 'history'
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-[var(--app-border)] bg-[var(--app-surface-2)] hover:border-gray-400/40'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm text-[var(--app-ink)]">
                <History size={16} className="text-amber-500" /> Order History Only
              </div>
              <p className="text-[11px] text-[var(--app-muted)] mt-1.5 leading-relaxed">
                Deletes all orders (customer, vendor & delivery history). Products, shops and users
                stay intact.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setResetMode('full')}
              className={`text-left p-4 rounded-2xl border-2 transition ${
                resetMode === 'full'
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-[var(--app-border)] bg-[var(--app-surface-2)] hover:border-gray-400/40'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm text-[var(--app-ink)]">
                <Trash2 size={16} className="text-red-500" /> Full Platform Reset
              </div>
              <p className="text-[11px] text-[var(--app-muted)] mt-1.5 leading-relaxed">
                Wipes orders, products, shops, coupons, banners, shop categories and all non-admin
                users.
              </p>
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--app-muted-2)] uppercase tracking-wider mb-2">
              Type <span className="text-red-500 font-mono">RESET</span> to confirm
            </label>
            <input
              type="text"
              name="platform-reset-confirm"
              id="platform-reset-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              onFocus={(e) => {
                // Clear browser autofill (email etc.) if it snuck in
                if (e.target.value.includes('@') || e.target.value !== 'RESET') {
                  // keep only if user already typed RESET
                  if (e.target.value.includes('@')) setConfirmText('');
                }
              }}
              placeholder="Type RESET here (not your email)"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              inputMode="text"
              data-lpignore="true"
              data-1p-ignore="true"
              data-form-type="other"
              className="block w-full border border-red-500/40 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-[var(--app-surface-2)] text-[var(--app-ink)] font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans placeholder:text-[var(--app-muted-2)]"
            />
            {confirmText && confirmText !== 'RESET' && (
              <p className="text-[11px] text-amber-500 mt-1.5 font-medium">
                Must be exactly <span className="font-mono font-bold">RESET</span> — email / other text
                will keep the button disabled.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--app-muted-2)] uppercase tracking-wider mb-2">
              Your admin password
            </label>
            <input
              type="password"
              name="platform-reset-password"
              id="platform-reset-password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="Admin account password"
              autoComplete="new-password"
              data-lpignore="true"
              data-1p-ignore="true"
              data-form-type="other"
              className="block w-full border border-[var(--app-border)] rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-[var(--app-surface-2)] text-[var(--app-ink)]"
            />
          </div>

          <button
            type="submit"
            disabled={resetting || confirmText !== 'RESET' || !resetPassword}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm shadow-md transition"
          >
            <Trash2 size={16} />
            {resetting
              ? 'Resetting…'
              : resetMode === 'history'
                ? 'Reset Order History'
                : 'Reset Entire Platform'}
          </button>

          {confirmText !== 'RESET' || !resetPassword ? (
            <p className="text-center text-[11px] text-[var(--app-muted)]">
              Button unlocks only when you type <span className="font-mono text-red-400">RESET</span>{' '}
              and enter your password.
            </p>
          ) : null}

          {resetError && (
            <p className="text-center text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
              {resetError}
            </p>
          )}

          {resetResult && (
            <div className="text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 space-y-1.5 text-emerald-400">
              <p className="font-bold">{resetResult.message}</p>
              {resetResult.deleted && (
                <ul className="grid grid-cols-2 gap-1 text-[11px] font-medium text-emerald-300/90">
                  <li>Orders: {resetResult.deleted.orders}</li>
                  <li>Products: {resetResult.deleted.products}</li>
                  <li>Shops: {resetResult.deleted.shops}</li>
                  <li>Users: {resetResult.deleted.users}</li>
                  <li>Coupons: {resetResult.deleted.coupons}</li>
                  <li>Banners: {resetResult.deleted.banners}</li>
                  <li>Shop categories: {resetResult.deleted.shopCategories}</li>
                </ul>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
