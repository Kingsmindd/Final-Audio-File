import type { CartItem } from "../types";

export function cartStorageKey(userId?: string): string {
  return userId ? "audiophile-cart:user:" + encodeURIComponent(userId) : "audiophile-cart:guest";
}

export function readSavedCart(key: string): CartItem[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved.filter((item): item is CartItem =>
      item !== null && typeof item === "object" &&
      typeof item._id === "string" && typeof item.name === "string" &&
      typeof item.image === "string" && typeof item.price === "number" &&
      Number.isFinite(item.price) && item.price >= 0 &&
      Number.isInteger(item.quantity) && item.quantity > 0
    );
  } catch { return []; }
}

export function saveCart(key: string, items: CartItem[]): void {
  try {
    if (items.length) localStorage.setItem(key, JSON.stringify(items));
    else localStorage.removeItem(key);
  } catch { /* Keep the current bag usable if browser storage is unavailable. */ }
}

// Preserve the old bag only for the account already signed in at upgrade time.
// If the upgrade happens as a guest, never assign the unowned bag to a later login.
export function loadAccountCart(userId?: string): CartItem[] {
  const key = cartStorageKey(userId);
  try {
    if (!localStorage.getItem("audiophile-cart:scoped-v1")) {
      const signedIn = JSON.parse(localStorage.getItem("audiophile-user") || "null");
      if (userId && signedIn?._id === userId && localStorage.getItem(key) === null) {
        const legacy = readSavedCart("audiophile-cart");
        if (legacy.length) {
          localStorage.setItem(key, JSON.stringify(legacy));
          localStorage.removeItem("audiophile-cart");
        }
      }
      localStorage.setItem("audiophile-cart:scoped-v1", "true");
    }
  } catch { /* Existing scoped carts remain readable if migration is unavailable. */ }
  return readSavedCart(key);
}
