import React, { createContext, useState, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';
import { playCartSound } from '../utils/sound';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

// Helper to generate a unique ID for a cart item based on product and variants
const generateCartItemId = (product, size, color) => {
  const productId = product._id || product.id;
  const sizeId = size || 'no-size';
  const colorId = color || 'no-color';
  return `${productId}-${sizeId}-${colorId}`;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('hyperlocal_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map(item => {
          const cartItemId = item.cartItemId || generateCartItemId(item.product, item.selectedSize, item.selectedColor);
          return { 
            ...item, 
            cartItemId,
            selected: typeof item.selected === 'boolean' ? item.selected : true 
          };
        });
      }
    } catch (e) {
      console.error("Failed to parse cart", e);
    }
    return [];
  });

  // Save to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('hyperlocal_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, qty = 1) => {
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

    // Calculate effective price taking discount into account
    const effectivePrice = product.discount_percent > 0
      ? Math.round(product.price * (1 - product.discount_percent / 100))
      : (product.price ?? product.effectivePrice);

    const selectedSize = product.selectedSize || null;
    const selectedColor = product.selectedColor || null;
    const addQty = Math.max(1, Number(qty) || 1);
    
    const cartItemId = generateCartItemId(product, selectedSize, selectedColor);

    setCartItems(prev => {
      const existing = prev.find(item => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map(item =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + addQty, price: effectivePrice, selected: true }
            : item
        );
      }
      return [...prev, {
        cartItemId,
        product: { ...product, shopId, shopName },
        quantity: addQty,
        price: effectivePrice,
        shopId,
        shopName,
        selectedSize,
        selectedColor,
        selected: true,
      }];
    });

    toast.success(`${addQty > 1 ? addQty + ' x ' : ''}${product.name || 'Item'} added to cart!`, {
      icon: '🛒',
    });
    
    playCartSound();
  };

  /** Bulk-add from reorder API (single state update) */
  const addItemsToCart = (items = []) => {
    if (!items.length) return;
    setCartItems((prev) => {
      let next = [...prev];
      for (const entry of items) {
        const product = entry.product || entry;
        const rawShop = product.shopId;
        const shopId =
          rawShop && typeof rawShop === 'object'
            ? rawShop._id || rawShop.id
            : rawShop;
        const shopName =
          product.shopName ||
          (rawShop && typeof rawShop === 'object' ? rawShop.shopName : '') ||
          '';
        const effectivePrice =
          entry.price ??
          (product.discount_percent > 0
            ? Math.round(product.price * (1 - product.discount_percent / 100))
            : product.price);
        const selectedSize = entry.selectedSize || product.selectedSize || null;
        const selectedColor = entry.selectedColor || product.selectedColor || null;
        const addQty = Math.max(1, Number(entry.quantity) || 1);
        const pid = product._id || product.id;
        
        const cartItemId = generateCartItemId({ id: pid }, selectedSize, selectedColor);

        const idx = next.findIndex(item => item.cartItemId === cartItemId);

        if (idx >= 0) {
          next[idx] = {
            ...next[idx],
            quantity: next[idx].quantity + addQty,
            price: effectivePrice,
            selected: true,
          };
        } else {
          next.push({
            cartItemId,
            product: { ...product, id: pid, _id: pid, shopId, shopName },
            quantity: addQty,
            price: effectivePrice,
            shopId,
            shopName,
            selectedSize,
            selectedColor,
            selected: true,
          });
        }
      }
      return next;
    });
  };

  const removeFromCart = (cartItemId) => {
    setCartItems((prev) =>
      prev.filter((item) => item.cartItemId !== cartItemId)
    );
  };

  const updateQuantity = (cartItemId, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQ = item.quantity + delta;
            return newQ > 0 ? { ...item, quantity: newQ } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };
  
  const toggleItemSelection = (cartItemId) => {
    setCartItems(prev => prev.map(item => 
      item.cartItemId === cartItemId ? { ...item, selected: !item.selected } : item
    ));
  };

  const isAllSelected = () => cartItems.every(item => item.selected);

  const toggleSelectAll = () => {
    const allSelected = isAllSelected();
    setCartItems(prev => prev.map(item => ({ ...item, selected: !allSelected })));
  };

  const removeItems = (ids = []) => {
    if (!ids?.length) return;
    const idSet = new Set(ids.map((id) => String(id)));
    setCartItems((prev) =>
      prev.filter((item) => {
        const cartItemId = item.cartItemId != null ? String(item.cartItemId) : null;
        const productId = String(
          item.product?._id || item.product?.id || item.productId || item._id || ''
        );
        // Prefer cartItemId match; also accept bare product ids (legacy callers)
        if (cartItemId && idSet.has(cartItemId)) return false;
        if (productId && idSet.has(productId)) return false;
        return true;
      })
    );
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
      addItemsToCart,
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
