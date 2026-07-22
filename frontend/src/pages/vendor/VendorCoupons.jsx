import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Tag, Image as ImageIcon, ArrowRight } from 'lucide-react';

const VendorCoupons = () => {
  return (
    <div className="space-y-6 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Coupons & Offers</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Discount codes are coming soon. Use product promos and banners for marketing today.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 md:p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-4">
          <Ticket size={28} />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Coupon codes — coming soon</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
          You will be able to create percentage / flat discounts and share codes with customers.
          Until then, drive sales with product tags and homepage ads.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/vendor/products"
          className="group bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-blue-200 hover:shadow-md transition flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Tag size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 group-hover:text-blue-700">Product promotions</p>
            <p className="text-xs text-gray-500 mt-1">
              Set promo tags and discount % on individual products (Products → tag icon).
            </p>
          </div>
          <ArrowRight size={16} className="text-gray-300 group-hover:text-blue-500 mt-1 shrink-0" />
        </Link>

        <Link
          to="/vendor/banners"
          className="group bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-orange-200 hover:shadow-md transition flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <ImageIcon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 group-hover:text-orange-700">Homepage banners</p>
            <p className="text-xs text-gray-500 mt-1">
              Create Flipkart-style ads that show on the customer home page slider.
            </p>
          </div>
          <ArrowRight size={16} className="text-gray-300 group-hover:text-orange-500 mt-1 shrink-0" />
        </Link>
      </div>
    </div>
  );
};

export default VendorCoupons;
