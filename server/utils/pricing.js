import Product from '../models/Product.js';
import { Coupon } from '../models/Misc.js';

export const GST_RATE = 0.03; // GST on jewellery in India is 3%
export const FREE_SHIPPING_ABOVE = 10000;
export const SHIPPING_CHARGE = 199;

export const evaluateCoupon = async (code, itemsTotal) => {
  if (!code) return { discount: 0 };
  const c = await Coupon.findOne({ code: String(code).toUpperCase().trim(), isActive: true });
  if (!c) throw Object.assign(new Error('Invalid coupon code'), { status: 400 });
  if (c.expiresAt && c.expiresAt < new Date()) throw Object.assign(new Error('Coupon has expired'), { status: 400 });
  if (c.usageLimit && c.usedCount >= c.usageLimit) throw Object.assign(new Error('Coupon usage limit reached'), { status: 400 });
  if (itemsTotal < c.minOrder) throw Object.assign(new Error(`Minimum order of ₹${c.minOrder} required`), { status: 400 });
  let discount = c.type === 'percent' ? (itemsTotal * c.value) / 100 : c.value;
  if (c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
  discount = Math.min(Math.round(discount), itemsTotal);
  return { discount, coupon: c };
};

// Always price from the database, never from client-sent numbers.
export const priceCart = async (cartItems, couponCode) => {
  if (!Array.isArray(cartItems) || !cartItems.length) throw Object.assign(new Error('Cart is empty'), { status: 400 });
  const products = await Product.find({ _id: { $in: cartItems.map((i) => i.product) }, isActive: true });
  const map = new Map(products.map((p) => [String(p._id), p]));
  const items = [];
  let itemsTotal = 0;
  for (const ci of cartItems) {
    const p = map.get(String(ci.product));
    const qty = Math.max(1, Math.floor(Number(ci.qty) || 1));
    if (!p) throw Object.assign(new Error('A product in your cart is no longer available'), { status: 400 });
    if (p.stock < qty) throw Object.assign(new Error(`Only ${p.stock} left of "${p.name}"`), { status: 400 });
    if (p.sizes?.length && !p.sizes.includes(ci.size)) throw Object.assign(new Error(`Select a size for "${p.name}"`), { status: 400 });
    items.push({ product: p._id, name: p.name, image: p.images?.[0]?.url, price: p.price, qty, size: ci.size });
    itemsTotal += p.price * qty;
  }
  const { discount, coupon } = await evaluateCoupon(couponCode, itemsTotal);
  const taxable = itemsTotal - discount;
  const shippingCharge = taxable >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_CHARGE;
  const tax = Math.round(taxable * GST_RATE);
  const total = taxable + tax + shippingCharge;
  return { items, itemsTotal, discount, coupon, shippingCharge, tax, total };
};
