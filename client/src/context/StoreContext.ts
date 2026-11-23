import { createContext, useContext } from "react";
import type { CartItem, CartTotals, Order, Product } from "../types";

interface StoreContextType {
  products: Product[];
  cart: CartItem[];
  cartLoading: boolean;
  cartSaving: boolean;
  cartError: string;
  retryCart: () => Promise<void>;
  loading: boolean;
  error: string;
  retryProducts: () => void;
  refreshProducts: () => Promise<void>;
  upsertProduct: (product: Product) => void;
  removeProduct: (id: string) => void;

  // Cart operation
  addToCart: (product: Product, quantity?: number) => Promise<boolean>;
  removeFromCart: (productId: string) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  calculateTotals: () => CartTotals;

  // Product helpers
  getProductById: (id: string) => Product | undefined;
  getProductsByCategory: (category: string) => Product[];

  // UI state for cart sidebar and order confirmation modal
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isThankYouOpen: boolean;
  setIsThankYouOpen: (open: boolean) => void;
  orderData: Order | null;
  setOrderData: (data: Order | null) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function useStore(): StoreContextType {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within a StoreProvider");
  return context;
}

export default StoreContext;
