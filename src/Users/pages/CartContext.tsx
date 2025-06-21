import React, { createContext, useContext, useEffect, useState } from "react";
// Ensure these types are imported from your single source of truth: types.ts
import { type CartItem, type AddOn } from '../../Users/pages/types'; // Adjust path if necessary

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
  console.log("[CartContext] Attempting to load initial cart from localStorage...");
  try {
    const storedCartJson = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCartJson) {
      const parsedData = JSON.parse(storedCartJson);
      if (Array.isArray(parsedData)) {
        const validatedCart: CartItem[] = parsedData.map((item: any) => {
          const variantData = item.variant || {}; // Default to empty object if undefined
          const addOnsData = Array.isArray(item.addOns) ? item.addOns : [];

          // Reconstruct AddOn objects to match the multilingual AddOn type from types.ts
          const reconstructedAddOns: AddOn[] = addOnsData.map((addon: any) => ({
            id: String(addon.id || ''),
            name_en: String(addon.name_en || addon.name || ''), // Prioritize name_en, fallback to old 'name'
            name_ar: String(addon.name_ar || ''),             // Expect name_ar
            extraPrice: Number(addon.extraPrice) || 0,
            // Add any other fields defined in your AddOn type from types.ts
          }));

          return {
            id: String(item.id || ''),
            name: String(item.name || 'Unknown Product'), // Name in CartItem is already language-specific
            price: Number(item.price) || 0,
            image: String(item.image || ''),
            quantity: Number(item.quantity) || 1,
            Type: Array.isArray(item.Type) ? item.Type.map(String) : undefined,
            variant: {
              name: String(variantData.name || 'N/A'),     // Already language-specific
              value: String(variantData.value || 'N/A'),    // Already language-specific
              unitLabel: typeof variantData.unitLabel === 'string' ? variantData.unitLabel : undefined, // Already language-specific
            },
            // Store the full multilingual AddOn objects
            addOns: reconstructedAddOns.length > 0 ? reconstructedAddOns : undefined,
            eligibleOptionalAddOnIds: Array.isArray(item.eligibleOptionalAddOnIds) 
              ? item.eligibleOptionalAddOnIds.map(String) 
              : undefined,
            // Ensure all other properties from CartItem type are handled or defaulted
          } as CartItem; // Cast to CartItem from types.ts
        }).filter(item => item.id && item.name); // Basic filter for valid items

        console.log("[CartContext] Initial cart loaded and validated from localStorage:", validatedCart);
        return validatedCart;
      } else {
        console.warn("[CartContext] Stored cart is not an array during initial load, clearing localStorage.");
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  } catch (error) {
    console.error("[CartContext] Error parsing or validating cart from localStorage during initial load:", error);
    localStorage.removeItem(CART_STORAGE_KEY); // Clear corrupted data
  }
  console.log("[CartContext] No valid cart in localStorage, starting with an empty cart.");
  return []; // Default to empty array if nothing valid in localStorage
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

  // Save cart to localStorage whenever the cart state changes
  useEffect(() => {
    console.log("[CartContext] Cart state changed, saving to localStorage:", cart);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const generateCartItemKey = (item: CartItem): string => {
    // item.variant.name and item.variant.value are already the displayed (language-specific) strings
    const variantName = item.variant?.name || "no-variant-name";
    const variantValue = item.variant?.value || "no-variant-value";
    const variantKey = `${variantName}-${variantValue}`;
    
    // item.addOns[] should contain AddOn objects with an 'id'
    const addOnsKey = item.addOns?.map((a: AddOn) => a.id).sort().join("-") || "no-addons";
    return `${item.id}-${variantKey}-${addOnsKey}`;
  };

  const addToCart = (newItem: CartItem) => {
    // newItem is expected to be a fully formed CartItem:
    // - name, variant.name, variant.value, variant.unitLabel are already translated.
    // - newItem.addOns is an array of full multilingual AddOn objects (if any).
    setCart((prevCart) => {
      const newItemKey = generateCartItemKey(newItem);
      const existingItemIndex = prevCart.findIndex(item => generateCartItemKey(item) === newItemKey);

      if (existingItemIndex !== -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += newItem.quantity;
        // If price or other details could change on re-add with same key, update them:
        // updatedCart[existingItemIndex].price = newItem.price; 
        // updatedCart[existingItemIndex].image = newItem.image; 
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
    const itemInCart = cart.find(item => generateCartItemKey(item) === itemKeyToUpdate);
    const isUnitOrDozen = itemInCart?.Type?.some(t => ["unit", "dozen"].includes(t.toLowerCase()));
    const minQuantity = isUnitOrDozen ? 1 : 0.01;
    const validatedQuantity = Math.max(minQuantity, newQuantity);
    
    setCart((prevCart) =>
      prevCart.map((item) =>
        generateCartItemKey(item) === itemKeyToUpdate ? { ...item, quantity: validatedQuantity } : item
      )
    );
  };

  const updateCartItem = (originalItemKey: string, newItemData: CartItem) => {
    // newItemData is expected to be a fully formed CartItem with correctly translated text
    // and its addOns array containing full multilingual AddOn objects.
    setCart(prevCart => 
        prevCart.map(item => 
            generateCartItemKey(item) === originalItemKey ? newItemData : item
        )
    );
  };

  
  const clearCart = () => {
    setCart([]); // useEffect will save the empty array to localStorage
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


// Types should be imported directly from types.ts by consuming components.
// Do NOT re-export types from here to avoid conflicts and maintain a single source of truth.
// export type { AddOn, CartItem }; 
