// Typescipt interface that describes the shape of data used throughout the React application

// ------ Product ----
// Representing a product from the API (with mongodb_id)

export interface Product {
  _id: string;
  name: string;
  category: "headphones" | "speakers" | "earphones";
  price: number;
  image: string;
  description: string;
  features: string;
  inTheBox: BoxItem[];
  gallery: string[];
  isNew: boolean;
  createdAt: string;
}

// One item included in the product box
export interface BoxItem {
  quantity: number;
  item: string;
}

// -----Cart----
// A cart item is a product + a quantity
export interface CartItem extends Product {
  quantity: number;
}

// The calculated totals for the shoppping cart
export interface CartTotals {
  subtotal: number;
  shipping: number;
  vat: number;
  grandtotal: number;
}

// ----- Users -----
// The user object stored in our AuthContext
export interface User {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  avatar?: string;
  phone?: string;
  address?: string;
  token: string;
}

// -----Order----
// ----- Billing/Shipping-----
export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  zipCode: string;
  city: string;
  country: string;
  paymentMethod: "e-money" | "Cash on Delivery";
  eMoneyNumber?: string;
  eMoneyPIN?: string;
}

// An item inside a placed order
export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

// The full order Object returned from the API
export interface Order {
  _id: string;
  orderId: string;
  userId?: string;
  customerInfo: CustomerInfo;
  cartItems: OrderItem[];
  orderSummary: CartTotals;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
}

// ====== Checkout Form ====
//  Form fields for the checkout page
export interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  zipCode: string;
  city: string;
  country: string;
  paymentMethod: "e-Money" | "Cash on delivery";
  eMoneyNumber: string;
  eMoneyPIN: string;
}

// Form validation errors - same keys as the force, but values are error strings
export type FormErrors = Partial<Record<keyof CheckoutFormData, string>>;

// ----- Admin Dashboard Stats -----
export interface DashboardStats {
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  pendingOders: number;
  recentOrders: Order[];
  monthlyRevenue: {
    _id: { year: number; month: number };
    revenue: number;
    count: number;
  }[];
}
