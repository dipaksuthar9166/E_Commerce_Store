import React, { useState } from 'react';
import { Plus, ShoppingCart, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProductImage } from '../utils/productImage';
import { useCart } from '../contexts/CartContext';
import { motion } from 'framer-motion';

const FrequentlyBoughtTogether = ({ mainProduct, relatedProduct }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  if (!mainProduct || !relatedProduct) return null;

  const getPrice = (product) => {
    const discount = product.discount_percent || product.discount || 0;
    const original = Number(product.price) || 0;
    return discount > 0 ? Math.round(original * (1 - discount / 100)) : original;
  };

  const mainPrice = getPrice(mainProduct);
  const relatedPrice = getPrice(relatedProduct);
  const totalPrice = mainPrice + relatedPrice;

  const originalTotal = (Number(mainProduct.price) || 0) + (Number(relatedProduct.price) || 0);

  const handleAddBoth = () => {
    // Add Main Product
    addToCart({
      id: mainProduct._id, _id: mainProduct._id,
      name: mainProduct.name, price: mainProduct.price,
      discount_percent: mainProduct.discount_percent || 0,
      image_path: getProductImage(mainProduct),
      images: mainProduct.images || [],
      shopId: mainProduct.shopId?._id || mainProduct.shopId || null,
      shopName: mainProduct.shopId?.shopName || mainProduct.shopName || '',
      selectedSize: mainProduct.sizes?.[0] || null,
      selectedColor: mainProduct.colors?.[0] || null,
    });

    // Add Related Product
    addToCart({
      id: relatedProduct._id, _id: relatedProduct._id,
      name: relatedProduct.name, price: relatedProduct.price,
      discount_percent: relatedProduct.discount_percent || 0,
      image_path: getProductImage(relatedProduct),
      images: relatedProduct.images || [],
      shopId: relatedProduct.shopId?._id || relatedProduct.shopId || null,
      shopName: relatedProduct.shopId?.shopName || relatedProduct.shopName || '',
      selectedSize: relatedProduct.sizes?.[0] || null,
      selectedColor: relatedProduct.colors?.[0] || null,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm mt-6">
      <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
        Frequently Bought Together
      </h2>

      <div className="flex flex-col md:flex-row md:items-center gap-6">
        
        {/* Images Section */}
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {/* Main Product */}
          <Link to={`/product/${mainProduct._id}`} className="block relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 group-hover:border-blue-200 transition-colors">
              <img 
                src={getProductImage(mainProduct)} 
                alt={mainProduct.name} 
                className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="absolute -bottom-2 -left-2 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
              This Item
            </div>
          </Link>

          <Plus className="w-6 h-6 text-slate-300 shrink-0" />

          {/* Related Product */}
          <Link to={`/product/${relatedProduct._id}`} className="block group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 group-hover:border-blue-200 transition-colors">
              <img 
                src={getProductImage(relatedProduct)} 
                alt={relatedProduct.name} 
                className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
              />
            </div>
          </Link>
        </div>

        {/* Pricing & Button Section */}
        <div className="flex-1 md:border-l border-slate-100 md:pl-6">
          <div className="mb-4">
            <p className="text-sm text-slate-500 font-medium mb-1">Total Price:</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                ₹{totalPrice.toLocaleString('en-IN')}
              </span>
              {originalTotal > totalPrice && (
                <span className="text-sm text-slate-400 line-through">
                  ₹{originalTotal.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <motion.button
            whileHover={{ y: -2 }} 
            whileTap={{ scale: 0.97 }}
            onClick={handleAddBoth}
            disabled={added}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              added 
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30'
            }`}
          >
            {added ? (
              <><Check className="w-4 h-4" /> Added Both to Cart</>
            ) : (
              <><ShoppingCart className="w-4 h-4" /> Add Both to Cart</>
            )}
          </motion.button>
        </div>

      </div>
    </div>
  );
};

export default FrequentlyBoughtTogether;
