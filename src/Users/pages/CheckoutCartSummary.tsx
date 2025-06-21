// In src/pages/CartContext.tsx (or your path to it)

import React, { createContext, useContext, useEffect, useState } from "react";
// --- THIS IS THE KEY FIX ---
// Import types from your central types.ts file
// Remove any local definitions of CartItem or AddOn from this file.
import { type CartItem } from '../../Users/pages/types'; // Adjust path if necessary

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemKey: string) => void;
  updateQuantity: (itemKey: string, quantity: number) => void;
  updateCartItem: (itemKey: string, updatedItem: CartItem) => void;
  clearCart: () => void;
  generateCartItemKey: (item: CartItem) => string;
}

const CART_STORAGE_KEY = 'myECommerceShoppingCart';

const loadInitialCart = (): CartItem[] => {
  console.log("[CartContext] Attempting to load initial cart from localStorage for useState...");
  try {
    const storedCartJson = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCartJson) {
      const storedCart = JSON.parse(storedCartJson);
      if (Array.isArray(storedCart)) {
        console.log("[CartContext] Initial cart loaded from localStorage:", storedCart);
        return storedCart;
      } else {
        console.warn("[CartContext] Stored cart is not an array during initial load, clearing localStorage.");
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  } catch (error) {
    console.error("[CartContext] Error parsing cart from localStorage during initial load:", error);
    localStorage.removeItem(CART_STORAGE_KEY);
  }
  console.log("[CartContext] No valid cart in localStorage, starting with an empty cart.");
  return [];
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(loadInitialCart);

  useEffect(() => {
    console.log("[CartContext] Cart state changed, saving to localStorage:", cart);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const generateCartItemKey = (item: CartItem): string => {
    // Ensure item.variant exists before trying to access its properties
    const variantName = item.variant?.name || "no-variant-name";
    const variantValue = item.variant?.value || "no-variant-value";
    const variantKey = `${variantName}-${variantValue}`;
    
    const addOnsKey = item.addOns?.map(a => a.id).sort().join("-") || "no-addons";
    return `${item.id}-${variantKey}-${addOnsKey}`;
  };

  const addToCart = (newItem: CartItem) => {
    setCart((prevCart) => {
      const newItemKey = generateCartItemKey(newItem);
      const existingItemIndex = prevCart.findIndex(item => generateCartItemKey(item) === newItemKey);

      if (existingItemIndex !== -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += newItem.quantity;
        // Optionally update other fields if they can change on re-add, e.g., price
        // updatedCart[existingItemIndex].price = newItem.price; 
        // updatedCart[existingItemIndex].image = newItem.image; 
        // updatedCart[existingItemIndex].variant = newItem.variant; 
        return updatedCart;
      } else {
        return [...prevCart, newItem];
      }
    });
  };

  const removeFromCart = (itemKeyToRemove: string) => {
    setCart((prevCart) => prevCart.filter(item => generateCartItemKey(item) !== itemKeyToRemove));
  };

  const updateQuantity = (itemKeyToUpdate: string, newQuantity: number) => {
    const validatedQuantity = Math.max(0.01, newQuantity); // Basic min, adjust if needed per item type
    setCart((prevCart) =>
      prevCart.map((item) =>
        generateCartItemKey(item) === itemKeyToUpdate ? { ...item, quantity: validatedQuantity } : item
      )
    );
  };

  const updateCartItem = (originalItemKey: string, newItemData: CartItem) => {
    setCart(prevCart => 
        prevCart.map(item => 
            generateCartItemKey(item) === originalItemKey ? newItemData : item
        )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateCartItem,
        clearCart,
        generateCartItemKey
      }}
    >
      {children}
    </CartContext.Provider>
  );
};