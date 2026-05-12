import React, { createContext, useContext, useState } from 'react';

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
