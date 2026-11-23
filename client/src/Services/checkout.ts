import api from "./api";
import type { Order } from "../types";

type CheckoutInput = {
  customerInfo: Record<string, string>;
  cartItems: { _id: string; quantity: number }[];
};
type PendingCheckout = { fingerprint: string; key: string };
const memory = new Map<string, PendingCheckout>();
const storageKey = (identity: string) => "audiophile-checkout:" + encodeURIComponent(identity);

// A failed/ambiguous response keeps the same key, including after a page refresh.
export async function placeOrder(input: CheckoutInput, identity: string): Promise<Order> {
  const fingerprint = JSON.stringify({
    customerInfo: input.customerInfo,
    cartItems: [...input.cartItems].sort((a, b) => a._id.localeCompare(b._id)),
  });
  let pending = memory.get(identity);
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey(identity)) || "null");
    if (saved && typeof saved.fingerprint === "string" && typeof saved.key === "string") pending = saved;
  } catch { /* The in-memory key still protects retries if storage is unavailable. */ }
  if (!pending || pending.fingerprint !== fingerprint) {
    pending = { fingerprint, key: crypto.randomUUID() };
  }
  memory.set(identity, pending);
  try { sessionStorage.setItem(storageKey(identity), JSON.stringify(pending)); } catch { /* See above. */ }
  const { data } = await api.post<Order>("/orders", input, { headers: { "Idempotency-Key": pending.key } });
  return data;
}

export function finishCheckout(identity: string): void {
  memory.delete(identity);
  try { sessionStorage.removeItem(storageKey(identity)); } catch { /* No stored key to clear. */ }
}
