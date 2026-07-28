import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { ArrowLeft, Star, MapPin, Clock, Plus, Check, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { getProductImage } from '../utils/productImage';

const ShopDetail = () => {
  const { id } = useParams();
  const { addToCart, cartItems } = useCart();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedItems, setAddedItems] = useState({});

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const [shopRes, productsRes] = await Promise.all([
          api.get(`/shops/${id}`),
          api.get(`/shops/${id}/products`),
        ]);
        setShop(shopRes.data);
        setProducts(productsRes.data);
      } catch (err) {
        console.error('Failed to fetch shop data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchShopData();
  }, [id]);

  const handleAddToCart = (product) => {
    const price = product.discount_percent > 0
      ? Math.round(product.price * (1 - product.discount_percent / 100))
      : product.price;
    addToCart({
      id: product._id,
      _id: product._id,
      name: product.name,
      price: price,
      image_path: getProductImage(product),
      shopId: product.shopId,
      shopName: shop?.shopName,
    });
    setAddedItems(prev => ({ ...prev, [product._id]: true }));
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [product._id]: false }));
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-72 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-gray-500 text-sm">Loading shop details...</p>
      </div>
    );
  }

  if (!shop) {
    return <div className="p-8 text-center text-gray-500">Shop not found.</div>;
  }

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      {/* Header Image */}
      <div className="relative h-48 md:h-64 -mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8 mb-6">
        <img
          src={shop.imagePath || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=800"}
          alt={shop.shopName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="absolute top-4 left-4">
          <Link to="/shops" className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white inline-flex hover:bg-white/40 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        <div className="absolute bottom-4 left-4 md:left-8 right-4 text-white">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold mb-1">{shop.shopName}</h1>
              <p className="text-white/80 text-sm flex items-center">
                <MapPin className="w-4 h-4 mr-1" /> {shop.address}
              </p>
            </div>
            <div className="bg-white text-gray-900 px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1 shadow-lg">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              4.5
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100 overflow-x-auto hide-scrollbar">
        <div className="bg-green-50 text-green-700 px-4 py-2 rounded-xl text-sm font-semibold flex items-center whitespace-nowrap">
          <Clock className="w-4 h-4 mr-2" /> Delivery in 25-30 mins
        </div>
        <span className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap">Fast Delivery</span>
        <span className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${shop.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {shop.isActive ? '🟢 Open Now' : '🔴 Closed'}
        </span>
      </div>

      {/* Products Grid */}
      <h2 className="text-xl font-bold mb-4">
        Products <span className="text-gray-400 font-normal text-sm">({products.length} items)</span>
      </h2>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-4xl">📦</div>
          <p className="font-semibold text-gray-500">No products listed yet</p>
          <p className="text-sm">Check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map(product => {
            const isAdded = addedItems[product._id];
            return (
              <div key={product._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow flex flex-col h-full group">
                <Link to={`/product/${product._id}`} className="contents">
                  <div className="aspect-square mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    {product.imagePath ? (
                      <img src={`/api/products/${product._id}/image`} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <span className="text-4xl">🛒</span>
                    )}
                  </div>
                </Link>
                <div className="flex flex-col flex-1">
                  <h3 className="font-semibold text-gray-800 line-clamp-2 mb-1">{product.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">{product.description}</p>

                  {product.stock === 0 && (
                    <span className="text-xs text-red-500 font-semibold mb-2">Out of Stock</span>
                  )}

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-end gap-2">
                      <span className="font-bold text-lg text-gray-900">
                        ₹{product.discount_percent > 0 ? Math.round(product.price * (1 - product.discount_percent / 100)) : product.price}
                      </span>
                      {product.discount_percent > 0 && (
                        <span className="text-gray-400 line-through text-sm">
                          ₹{product.price}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${
                        isAdded
                          ? 'bg-green-500 text-white scale-110'
                          : product.stock === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                      }`}
                    >
                      {isAdded ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShopDetail;
