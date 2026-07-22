import React from 'react';
import { HelpCircle, Mail, MessageCircle, BookOpen, Package, ShoppingBag, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const faqs = [
  {
    q: 'How do categories reach the customer app?',
    a: 'Create a category under Categories, then assign products to it. Empty categories stay hidden until at least one product is listed.',
  },
  {
    q: 'How do I update order status?',
    a: 'Open Orders → pick the tab (New / Accepted / Packing / Ready / Delivered) → use the action buttons on each card.',
  },
  {
    q: 'Where do homepage ads come from?',
    a: 'Banners / Ads. Create a product-style ad with image, title, theme, and target URL. After approval it appears on the customer home slider.',
  },
  {
    q: 'How is commission calculated?',
    a: 'Platform fee is 10% of delivered order value. Net earning = gross − commission. See Earnings for the full ledger.',
  },
];

const quickLinks = [
  { label: 'Manage products', to: '/vendor/products', icon: Package },
  { label: 'Orders', to: '/vendor/orders', icon: ShoppingBag },
  { label: 'Banners / Ads', to: '/vendor/banners', icon: ImageIcon },
];

const VendorSupport = () => {
  return (
    <div className="space-y-6 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Quick answers for sellers. Contact us if you still need help.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href="mailto:support@mersko.in"
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:border-blue-200 transition"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Mail size={18} />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Email support</p>
            <p className="text-sm text-blue-600 mt-0.5">support@mersko.in</p>
            <p className="text-xs text-gray-500 mt-1">We typically reply within 1 business day.</p>
          </div>
        </a>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <MessageCircle size={18} />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Seller chat</p>
            <p className="text-sm text-gray-500 mt-0.5">In-app chat is coming soon.</p>
            <p className="text-xs text-gray-400 mt-1">Use email for account or payout issues.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
          <BookOpen size={18} className="text-blue-500" />
          Frequently asked
        </h2>
        <div className="space-y-3">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="group rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-3 open:bg-white open:shadow-sm"
            >
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3 text-sm font-semibold text-gray-800">
                <span className="flex items-center gap-2">
                  <HelpCircle size={14} className="text-gray-400 shrink-0" />
                  {item.q}
                </span>
                <span className="text-gray-400 text-xs group-open:rotate-180 transition">▼</span>
              </summary>
              <p className="mt-2 pl-6 text-sm text-gray-600 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quick links</p>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map(({ label, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition"
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VendorSupport;
