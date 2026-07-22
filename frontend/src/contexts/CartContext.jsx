import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  
  // Try to load cart from localStorage on init
  useEffect(() => {
    const savedCart = localStorage.getItem('hyperlocal_cart');
    if (savedCart) {
      try {
        // Ensure all items have a `selected` property, default to true
        const parsedCart = JSON.parse(savedCart);
        const validatedCart = parsedCart.map(item => ({ ...item, selected: typeof item.selected === 'boolean' ? item.selected : true }));
        setCartItems(validatedCart);
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  // Save to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('hyperlocal_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product) => {
    // shopId may be ObjectId string OR populated { _id, shopName } from API
    const rawShop = product.shopId;
    const shopId =
      rawShop && typeof rawShop === 'object'
        ? rawShop._id || rawShop.id
        : rawShop;
    const shopName =
      product.shopName ||
      (rawShop && typeof rawShop === 'object' ? rawShop.shopName : '') ||
      '';

    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id || item.product._id === product._id);
      if (existing) {
        return prev.map(item =>
          (item.product.id === product.id || item.product._id === product._id)
            ? { ...item, quantity: item.quantity + 1, selected: true } // Also mark as selected if re-added
            : item
        );
      }
      return [...prev, {
        product: { ...product, shopId, shopName },
        quantity: 1,
        price: product.price,
        shopId,
        shopName,
        selected: true, // Selected by default
      }];
    });
  };

  const matchId = (product, productId) =>
    product._id === productId || product.id === productId;

  const removeFromCart = (productId) => {
    setCartItems((prev) =>
      prev.filter((item) => !matchId(item.product, productId))
    );
  };

  const updateQuantity = (productId, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (matchId(item.product, productId)) {
            const newQ = item.quantity + delta;
            return newQ > 0 ? { ...item, quantity: newQ } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };
  
  const toggleItemSelection = (productId) => {
    setCartItems(prev => prev.map(item => 
      matchId(item.product, productId) ? { ...item, selected: !item.selected } : item
    ));
  };

  const isAllSelected = () => cartItems.every(item => item.selected);

  const toggleSelectAll = () => {
    const allSelected = isAllSelected();
    setCartItems(prev => prev.map(item => ({ ...item, selected: !allSelected })));
  };

  const removeItems = (productIds) => {
    setCartItems(prev => prev.filter(item => !productIds.includes(item.product._id) && !productIds.includes(item.product.id)));
  };

  const clearCart = () => setCartItems([]);

  const getCartTotal = () => {
    return cartItems
      .filter(item => item.selected)
      .reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  const getSelectedItems = () => cartItems.filter(item => item.selected);

  const getCartCount = () => {
    return cartItems
      .filter(item => item.selected)
      .reduce((count, item) => count + item.quantity, 0);
  };
  
  const getFullCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      removeItems,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartCount,
      getFullCartCount,
      toggleItemSelection,
      toggleSelectAll,
      isAllSelected,
      getSelectedItems
    }}>
      {children}
    </CartContext.Provider>
  );
};
