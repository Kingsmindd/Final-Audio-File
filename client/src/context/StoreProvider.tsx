import { useCallback, useEffect, useState, useRef, type ReactNode } from "react";
import api from "../Services/api";
import { useAuth } from "./AuthContext";
import { useAccountBag } from "./useAccountBag";
import { normalizeProduct, mergeProduct, productsInCategory } from "../utils/catalog";
import type { CartTotals, Order, Product } from "../types";
import StoreContext from "./StoreContext";

interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { cart, cartLoading, cartSaving, cartError, retryCart, addToCart, removeFromCart, updateQuantity, clearCart } = useAccountBag(user);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState("");
  const catalogRequest = useRef(0);

  // Model/ sidebar visiblity states
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isThankYouOpen, setIsThankYouOpen] = useState<boolean>(false);
  const [orderData, setOrderData] = useState<Order | null>(null);

// ---- Fetching products on mount ---
  const fetchProducts = useCallback(async (): Promise<void> => {
    const request = ++catalogRequest.current;
    try {
      const { data } = await api.get<Product[]>("/products");
      if (request === catalogRequest.current) { setProducts(data.map(normalizeProduct)); setError(""); }
    } catch {
      if (request === catalogRequest.current) setError("The store is taking a moment to connect. Please try again.");
    } finally {
      if (request === catalogRequest.current) setLoading(false);
    }
  }, []);
  const refreshProducts = useCallback(() => fetchProducts(), [fetchProducts]);
  const signalProductChange = () => {
    try { localStorage.setItem("audiophile-catalog-updated", String(Date.now())); } catch { /* The current tab still updates when storage is unavailable. */ }
  };
  const upsertProduct = (product: Product) => {
    catalogRequest.current++;
    setLoading(false);
    setError("");
    setProducts(current => mergeProduct(current, product));
    signalProductChange();
  };
  const removeProduct = (id: string) => {
    catalogRequest.current++;
    setLoading(false);
    setError("");
    setProducts(current => current.filter(p => p._id !== id));
    signalProductChange();
  };
  useEffect(() => {
    async function load() { await fetchProducts(); }
    void load();
  }, [fetchProducts]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") void refreshProducts(); };
    const onStorage = (event: StorageEvent) => { if (event.key === "audiophile-catalog-updated") refresh(); };
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [refreshProducts]);
  // ---- CALCULATE TOTALS ---
  // Returns  the finiacial breakdown of the cart
  const calculateTotals = (): CartTotals => {
    //Subtotal = sum of (price * quantity) for all item
    const subtotal = cart.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );

    const shipping = cart.length > 0 ? 50 : 0; // Free shipping if cart is empty
    const vat = Math.round(subtotal * 0.075); // 7.5 vat
    const grandTotal = subtotal + shipping + vat;

    return { subtotal, shipping, vat, grandTotal };
  };

  // --- GET PRODUCT BY ID ---
  const getProductById = (id: string): Product | undefined => {
    return products.find((product) => product._id === id);
  };
  // ---- GET PRODUCTS BY CATEGORY ---
  const getProductsByCategory = (category: string): Product[] => {
    return productsInCategory(products, category);
  };

  // -- Provide evrything to children
  return (
    <StoreContext.Provider
      value={{
        products,
        cart,
        cartLoading,
        cartSaving,
        cartError,
        retryCart,
        loading,
        error,
        retryProducts: () => { setLoading(true); setError(""); void fetchProducts(); },
        refreshProducts,
        upsertProduct,
        removeProduct,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        calculateTotals,
        getProductById,
        getProductsByCategory,
        isCartOpen,
        setIsCartOpen,
        isThankYouOpen,
        setIsThankYouOpen,
        orderData,
        setOrderData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
