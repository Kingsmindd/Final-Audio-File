import { NextFunction, Response } from "express";
import mongoose from "mongoose";
import User from "../models/User";
import Product from "../models/Product";
import type { AuthRequest } from "../types/indexServer";

type SavedItem = { productId: mongoose.Types.ObjectId; quantity: number };
async function hydrate(items: SavedItem[]) {
  const products = await Product.find({ _id: { $in: items.map(item => item.productId) } }).lean();
  const byId = new Map(products.map(product => [product._id.toString(), product]));
  // Deleted products are omitted; names and prices always come from the catalog.
  return items.flatMap(item => {
    const product = byId.get(item.productId.toString());
    return product ? [{ ...product, _id: product._id.toString(), quantity: item.quantity }] : [];
  });
}

export async function getCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.user!._id).select("+savedCart +cartRevision +cartInitialized");
    if (!user) { res.status(401).json({ message: "User not found" }); return; }
    res.setHeader("Cache-Control", "no-store");
    res.json({ items: await hydrate(user.savedCart || []), revision: user.cartRevision || 0, initialized: user.cartInitialized || false });
  } catch (error) { next(error); }
}

export async function replaceCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { items, revision } = req.body ?? {};
    if (!Array.isArray(items) || items.length > 100 || !Number.isSafeInteger(revision) || revision < 0) {
      res.status(400).json({ message: "Provide up to 100 bag items and a valid revision" }); return;
    }
    const seen = new Set<string>();
    const saved: SavedItem[] = [];
    for (const item of items) {
      if (!item || typeof item.productId !== "string" || !mongoose.Types.ObjectId.isValid(item.productId) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) {
        res.status(400).json({ message: "Each bag item needs a valid product ID and a quantity from 1 to 999" }); return;
      }
      const productId = new mongoose.Types.ObjectId(item.productId);
      const key = productId.toString();
      if (seen.has(key)) { res.status(400).json({ message: "Duplicate bag product" }); return; }
      seen.add(key);
      saved.push({ productId, quantity: item.quantity });
    }
    const count = await Product.countDocuments({ _id: { $in: saved.map(item => item.productId) } });
    if (count !== saved.length) { res.status(400).json({ message: "One or more bag products are no longer available" }); return; }
    const versionFilter = revision === 0
      ? { $or: [{ cartRevision: 0 }, { cartRevision: { $exists: false } }] }
      : { cartRevision: revision };
    const user = await User.findOneAndUpdate(
      { _id: req.user!._id, ...versionFilter },
      { $set: { savedCart: saved, cartInitialized: true }, $inc: { cartRevision: 1 } },
      { new: true, runValidators: true },
    ).select("+savedCart +cartRevision +cartInitialized");
    if (!user) {
      res.status(409).json({ message: "Your bag changed in another session. Reload it before trying again." }); return;
    }
    res.setHeader("Cache-Control", "no-store");
    res.json({ items: await hydrate(user.savedCart || []), revision: user.cartRevision, initialized: true });
  } catch (error) { next(error); }
}
