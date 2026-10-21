import { useEffect, useRef, useSyncExternalStore } from "react";
import toast from "react-hot-toast";
import api from "../Services/api";
import { AccountBag, type RemoteBag } from "../utils/accountBag";
import { cartStorageKey, loadAccountCart, readSavedCart, saveCart } from "../utils/cartStorage";
import type { CartItem, Product, User } from "../types";

export function useAccountBag(user: User | null) {
  const instance = useRef<AccountBag | null>(null);
  const key = cartStorageKey(user?._id);
  if (!instance.current) {
    const headers = user ? { Authorization: "Bearer " + user.token } : undefined;
    instance.current = new AccountBag(loadAccountCart(user?._id), items => saveCart(key, items), user ? {
      get: async () => (await api.get<RemoteBag>("/cart", {headers})).data,
      prepareImport: async items => {
        const {data:products}=await api.get<Product[]>("/products");
        const quantities=new Map(items.map(item=>[item._id,item.quantity]));
        return products.filter(product=>quantities.has(product._id)).map(product=>({...product,quantity:quantities.get(product._id)!}));
      },
      replace: async (items, revision) => (await api.put<RemoteBag>("/cart", {
        revision, items: items.map(item => ({productId:item._id,quantity:item.quantity})),
      }, {headers})).data,
    } : undefined);
  }
  const bag = instance.current;
  const state = useSyncExternalStore(bag.subscribe, bag.getSnapshot);
  useEffect(() => { void bag.start().catch(() => {}); }, [bag]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible" && user) void bag.refresh(); };
    const sync = (event: StorageEvent) => {
      if (event.key === key || event.key === null) {
        if (user) void bag.refresh();
        else void bag.change(() => readSavedCart(key));
      }
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", sync);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.removeEventListener("focus",refresh);window.removeEventListener("storage",sync);document.removeEventListener("visibilitychange",refresh); };
  }, [bag,key,user?._id]);
  const change = async (update: (items: CartItem[]) => CartItem[]) => {
    const ok = await bag.change(update);
    if (!ok) toast.error(bag.getSnapshot().error || "Your bag wasn’t saved. Please try again.");
    return ok;
  };
  return {
    cart: state.items,
    cartLoading: state.loading,
    cartSaving: state.saving > 0,
    cartError: state.error,
    retryCart: bag.refresh,
    addToCart: (product:Product,quantity=1) => change(items => {
      const existing=items.find(i=>i._id===product._id);
      return existing?items.map(i=>i._id===product._id?{...i,quantity:i.quantity+quantity}:i):[...items,{...product,quantity}];
    }),
    removeFromCart: (id:string) => change(items=>items.filter(i=>i._id!==id)),
    updateQuantity: (id:string,quantity:number) => change(items=>quantity<=0?items.filter(i=>i._id!==id):items.map(i=>i._id===id?{...i,quantity}:i)),
    clearCart: () => change(()=>[]),
  };
}
