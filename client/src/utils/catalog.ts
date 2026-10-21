import type { Product } from "../types";
export function normalizeProduct(product: Product): Product {
  return {
    ...product,
    category: product.category.trim().toLowerCase() as Product["category"],
    image: product.image.trim(),
    gallery: (product.gallery || []).map(url => url.trim()),
  };
}
export function mergeProduct(products: Product[], product: Product): Product[] {
  const normalized = normalizeProduct(product);
  return products.some(p => p._id === normalized._id)
    ? products.map(p => p._id === normalized._id ? normalized : p)
    : [normalized, ...products];
}
export function productsInCategory(products: Product[], category: string): Product[] {
  const selected = category.trim().toLowerCase();
  return products.filter(p => p.category.trim().toLowerCase() === selected);
}
