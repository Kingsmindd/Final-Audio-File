import mongoose from "mongoose";

interface CustomerDetails {
  name: string; email: string; phone: string; address: string;
  zipCode: string; city: string; country: string;
  paymentMethod: "e-Money" | "Cash on Delivery";
  eMoneyNumber?: string;
}
interface CheckoutItem { _id: string; quantity: number }
type CheckoutResult = { ok: true; customerInfo: CustomerDetails; cartItems: CheckoutItem[] } | { ok: false; message: string };
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

export function validateCheckout(body: unknown): CheckoutResult {
  if (!isRecord(body) || !isRecord(body.customerInfo)) return {ok:false,message:"Please provide customerInfo and cartItems"};
  const input = body.customerInfo;
  const fields = {name:120,email:254,phone:40,address:300,zipCode:30,city:120,country:120};
  const clean: Record<string,string> = {};
  for (const [field,max] of Object.entries(fields)) {
    const value = input[field];
    if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
      return {ok:false,message:field + " is required and must be text of at most " + max + " characters"};
    }
    clean[field]=value.trim();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) return {ok:false,message:"Please provide a valid email address"};
  if (!/^[+()\d.\s-]+$/.test(clean.phone) || clean.phone.replace(/\D/g,"").length < 7) return {ok:false,message:"Please provide a valid phone number"};
  if (input.paymentMethod !== "Cash on Delivery" && input.paymentMethod !== "e-Money") return {ok:false,message:"Invalid payment method"};
  if (input.eMoneyNumber !== undefined && (typeof input.eMoneyNumber !== "string" || input.eMoneyNumber.length > 64)) return {ok:false,message:"Invalid e-Money number"};
  if (input.paymentMethod === "e-Money" && (typeof input.eMoneyNumber !== "string" || !input.eMoneyNumber.trim())) return {ok:false,message:"e-Money number is required for this payment method"};
  if (!Array.isArray(body.cartItems) || body.cartItems.length < 1 || body.cartItems.length > 100) return {ok:false,message:"Cart must contain between 1 and 100 products"};
  const seen = new Set<string>();
  const cartItems: CheckoutItem[] = [];
  for (const item of body.cartItems) {
    if (!isRecord(item) || typeof item._id !== "string" || !mongoose.Types.ObjectId.isValid(item._id)) return {ok:false,message:"Each cart item must contain a valid product ID"};
    if (typeof item.quantity !== "number" || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) return {ok:false,message:"Each quantity must be a whole number from 1 to 999"};
    const id = new mongoose.Types.ObjectId(item._id).toHexString();
    if (seen.has(id)) return {ok:false,message:"Duplicate cart product; combine its quantities into one item"};
    seen.add(id);cartItems.push({_id:id,quantity:item.quantity});
  }
  // Explicitly select known fields, never store client totals, prices, or PINs.
  return {ok:true,cartItems,customerInfo:{
    name:clean.name,email:clean.email.toLowerCase(),phone:clean.phone,address:clean.address,
    zipCode:clean.zipCode,city:clean.city,country:clean.country,paymentMethod:input.paymentMethod,
    ...(input.paymentMethod === "e-Money" ? {eMoneyNumber:(input.eMoneyNumber as string).trim()} : {}),
  }};
}
