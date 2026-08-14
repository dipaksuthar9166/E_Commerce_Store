import React, { useState, useEffect } from 'react';
import {
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
import {
  PageShell,
  PageHeader,
  SurfaceCard,
  fieldClass,
  labelClass,
  btnPrimaryClass,
  AlertBanner,
} from '../../components/ui/PageUI';

const AdminSettings = () => {
  const [commission, setCommission] = useState(10);
  const [riderFee, setRiderFee] = useState(40);
  const [saved, setSaved] = useState(false);

  const defaultBanners = [
    { title: 'Summer Sale', image: 'https://via.placeholder.com/800x400', link: '/category/summer' },
    { title: 'New Arrivals', image: 'https://via.placeholder.com/800x400', link: '/category/new' },
  ];
  const [bannersJson, setBannersJson] = useState(JSON.stringify(defaultBanners, null, 2));

  const [resetMode, setResetMode] = useState('history');
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
    <PageShell className="max-w-2xl mx-auto">
      <PageHeader
        title="Platform Settings"
        subtitle="Configure platform parameters, commissions, and rider payouts"
      />

      <SurfaceCard delay={0.06}>
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className={labelClass}>Platform Commission (%)</label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="number"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                className={`${fieldClass} pl-10`}
                required
              />
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 block">
              Standard fee charged on all shop sales (gross amount).
            </span>
          </div>

          <div>
            <label className={labelClass}>Rider Flat Payout (₹)</label>
            <div className="relative">
              <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="number"
                value={riderFee}
                onChange={(e) => setRiderFee(e.target.value)}
                className={`${fieldClass} pl-10`}
                required
              />
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 block">
              Fixed fee paid to delivery boy per successful delivery.
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className={`${labelClass} flex items-center gap-2`}>
              <Image className="h-4 w-4" /> Homepage Advertisement Banners (JSON)
            </label>
            <textarea
              rows={7}
              value={bannersJson}
              onChange={(e) => setBannersJson(e.target.value)}
              className={`${fieldClass} h-auto py-3 font-mono text-xs whitespace-pre`}
            />
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 block">
              Update the banner array with title, image, and link properties.
            </span>
          </div>

          <button type="submit" className={`${btnPrimaryClass} w-full`}>
            <Save size={16} /> Save Configuration
          </button>

          {saved && (
            <p className="text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/50 rounded-xl p-2">
              Configuration saved successfully!
            </p>
          )}
        </form>
      </SurfaceCard>

      <SurfaceCard
        delay={0.1}
        className="!border-2 !border-rose-200 dark:!border-rose-800/60"
      >
        <div className="flex items-start gap-3 mb-5">
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle size={18} /> Danger Zone
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Permanently reset platform data. Admin accounts and global settings are always kept.
            </p>
          </div>
        </div>

        <form onSubmit={handleReset} className="space-y-4" autoComplete="off" data-form-type="other">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setResetMode('history')}
              className={`text-left p-4 rounded-2xl border-2 transition ${
                resetMode === 'history'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                <History size={16} className="text-amber-500" /> Order History Only
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Deletes all orders. Products, shops and users stay intact.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setResetMode('full')}
              className={`text-left p-4 rounded-2xl border-2 transition ${
                resetMode === 'full'
                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                <Trash2 size={16} className="text-rose-500" /> Full Platform Reset
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Wipes orders, products, shops, coupons, banners and non-admin users.
              </p>
            </button>
          </div>

          <div>
            <label className={labelClass}>
              Type <span className="text-rose-500 font-mono">RESET</span> to confirm
            </label>
            <input
              type="text"
              name="platform-reset-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              onFocus={(e) => {
                if (e.target.value.includes('@')) setConfirmText('');
              }}
              placeholder="Type RESET here (not your email)"
              autoComplete="off"
              spellCheck={false}
              className={`${fieldClass} border-rose-300 dark:border-rose-700/50 font-mono tracking-widest`}
            />
          </div>

          <div>
            <label className={labelClass}>Your admin password</label>
            <input
              type="password"
              name="platform-reset-password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="Admin account password"
              autoComplete="new-password"
              className={fieldClass}
            />
          </div>

          <button
            type="submit"
            disabled={resetting || confirmText !== 'RESET' || !resetPassword}
            className="w-full flex items-center justify-center gap-2 h-11 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm shadow-md transition"
          >
            <Trash2 size={16} />
            {resetting
              ? 'Resetting…'
              : resetMode === 'history'
                ? 'Reset Order History'
                : 'Reset Entire Platform'}
          </button>

          {(confirmText !== 'RESET' || !resetPassword) && (
            <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">
              Button unlocks only when you type{' '}
              <span className="font-mono text-rose-500">RESET</span> and enter your password.
            </p>
          )}

          {resetError && (
            <AlertBanner tone="rose" title="Reset failed">
              {resetError}
            </AlertBanner>
          )}

          {resetResult && (
            <div className="text-xs bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3 space-y-1.5 text-emerald-700 dark:text-emerald-300">
              <p className="font-bold">{resetResult.message}</p>
              {resetResult.deleted && (
                <ul className="grid grid-cols-2 gap-1 text-[11px] font-medium opacity-90">
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
      </SurfaceCard>
    </PageShell>
  );
};

export default AdminSettings;
