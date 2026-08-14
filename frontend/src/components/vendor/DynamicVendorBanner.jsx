import React from 'react';

// Props: Vendor dashboard se ye data pass hoga
const DynamicVendorBanner = ({
  productName = "Samsung Galaxy S26 Ultra",
  discount = "20%",
  offerDetail = "On Credit Cards (Axis, HDFC, ICICI, SBI)",
  deliveryTag = "Free Delivery Pan-India",
  productImageUrl = "/path-to-uploaded-product.png",
  themeColor = "from-blue-600 to-cyan-500", // Vendor color select kar sakta hai
  ctaText = "SHOP NOW"
}) => {
  return (
    <div className="relative w-full min-h-[300px] overflow-hidden rounded-2xl bg-[#090d16] border border-slate-800 p-6 md:p-10 shadow-2xl flex items-center justify-between">
      
      {/* 1. Dynamic Background Glows & Ambient Lighting */}
      <div className={`absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br ${themeColor} opacity-25 rounded-full blur-[120px] animate-pulse`}></div>
      <div className="absolute -bottom-20 right-1/4 w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px]"></div>

      {/* 2. Dynamic Light Sweep Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[sweep_5s_infinite_linear]"></div>

      {/* 3. Text & Offer Info (Left Side) */}
      <div className="relative z-10 max-w-lg space-y-4">
        <span className={`inline-block px-3.5 py-1 bg-gradient-to-r ${themeColor} text-white text-xs font-bold rounded-full uppercase tracking-wider shadow-md`}>
          Special Offer
        </span>

        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none">
          GET <span className={`text-transparent bg-clip-text bg-gradient-to-r ${themeColor}`}>{discount} OFF</span>
        </h2>

        <div className="space-y-1">
          <h3 className="text-xl font-bold text-slate-100">{productName}</h3>
          <p className="text-sm text-slate-400 font-medium">{offerDetail}</p>
        </div>

        {deliveryTag && (
          <p className="text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            {deliveryTag}
          </p>
        )}

        <div className="pt-2">
          <button className={`relative group overflow-hidden px-8 py-3 bg-gradient-to-r ${themeColor} text-white font-bold text-sm rounded-xl shadow-lg transition-all duration-300 hover:scale-105 active:scale-95`}>
            <span className="relative z-10">{ctaText}</span>
            <span className="absolute top-0 left-0 w-full h-full bg-white/25 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
          </button>
        </div>
      </div>

      {/* 4. Dynamic Product Showcase with Lighting Effect (Right Side) */}
      <div className="relative z-10 flex items-center justify-center max-w-[40%]">
        {/* Glow behind the dynamic product image */}
        <div className={`absolute inset-0 bg-gradient-to-r ${themeColor} rounded-full blur-3xl opacity-30 animate-pulse`}></div>
        
        <img 
          src={productImageUrl} 
          alt={productName} 
          className="relative z-10 max-h-64 object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)] transition-transform duration-500 hover:scale-105"
        />
      </div>

    </div>
  );
};

export default DynamicVendorBanner;
