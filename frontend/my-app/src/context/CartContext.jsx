import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getApiUrl } from '../utils/api';

// ── Create the context ──────────────────────────────────
const CartContext = createContext();

/**
 * Custom hook so any component can call:
 *   const { cartItems, addToCart, ... } = useCart();
 */
export function useCart() {
  return useContext(CartContext);
}

// ── Provider component ──────────────────────────────────
export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const { token } = useAuth();
  const syncTimeoutRef = useRef(null);
  // Ref to skip the initial sync triggered by loading cart from backend
  const skipNextSyncRef = useRef(false);

  // ── Load saved cart from backend when user logs in ────
  useEffect(() => {
    if (!token) {
      // User logged out → clear local cart
      setCartItems([]);
      return;
    }

    const loadCart = async () => {
      try {
        const res = await fetch(getApiUrl('/cart'), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const savedItems = await res.json();
          // Skip the sync that would be triggered by setCartItems
          skipNextSyncRef.current = true;
          setCartItems(savedItems);
        }
      } catch (err) {
        console.error('Failed to load cart:', err);
      }
    };

    loadCart();
  }, [token]);

  // ── Auto-sync cart to backend on every change (debounced) ──
  useEffect(() => {
    if (!token) return;

    // Skip the sync triggered by loading cart from backend
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    // Debounce: wait 500ms after last change before syncing
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch(getApiUrl('/cart'), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ items: cartItems })
        });
      } catch (err) {
        console.error('Failed to sync cart:', err);
      }
    }, 500);

    return () => clearTimeout(syncTimeoutRef.current);
  }, [cartItems, token]);

  /**
   * addToCart(product)
   *  - Expects a product object with: id, name, price, image, stock
   *  - Silently ignores the call if stock < 1 (out of stock)
   *  - If the item is already in the cart, increments quantity (up to stock)
   *  - Otherwise adds a new entry with quantity = 1
   */
  const addToCart = (product) => {
    // Don't add out-of-stock items
    if (!product || product.stock < 1) return;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);

      if (existing) {
        // Already at stock limit → do nothing
        if (existing.quantity >= product.stock) return prev;

        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      // New item
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          stock: product.stock,
          quantity: 1,
        },
      ];
    });
  };

  /**
   * updateQuantity(productId, newQty)
   *  - Clamps newQty to the range [1, stock]
   */
  const updateQuantity = (productId, newQty) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        const clamped = Math.max(1, Math.min(newQty, item.stock));
        return { ...item, quantity: clamped };
      })
    );
  };

  /**
   * removeFromCart(productId)
   *  - Removes the item entirely
   */
  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  /**
   * clearCart()
   *  - Empties the cart (useful after checkout)
   */
  const clearCart = () => setCartItems([]);

  // ── Derived values ──────────────────────────────────────
  const total = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const itemCount = cartItems.reduce(
    (count, item) => count + item.quantity,
    0
  );

  // ── Context value ───────────────────────────────────────
  const value = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    total,
    itemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export default CartContext;
