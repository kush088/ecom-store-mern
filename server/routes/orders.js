import { Router } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { Coupon } from '../models/Misc.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import { priceCart } from '../utils/pricing.js';

const router = Router();

const REQUIRED_ADDR = ['fullName', 'phone', 'line1', 'city', 'state', 'pincode'];

// Preview totals (used by cart & checkout)
router.post(
  '/quote',
  asyncHandler(async (req, res) => {
    const { items, itemsTotal, discount, shippingCharge, tax, total } = await priceCart(req.body.items, req.body.couponCode);
    res.json({ items, itemsTotal, discount, shippingCharge, tax, total });
  })
);

// Create an order (status placed, payment pending). Stock is deducted when payment succeeds
// (or immediately for COD).
router.post(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const { items: cart, couponCode, shippingAddress, paymentMethod } = req.body;
    for (const k of REQUIRED_ADDR) {
      if (!shippingAddress?.[k]) return res.status(400).json({ message: `Shipping address: ${k} is required` });
    }
    if (!/^\d{6}$/.test(shippingAddress.pincode)) return res.status(400).json({ message: 'Enter a valid 6-digit pincode' });
    const method = paymentMethod === 'cod' ? 'cod' : 'razorpay';
    const priced = await priceCart(cart, couponCode);

    const order = await Order.create({
      user: req.user._id,
      items: priced.items,
      shippingAddress,
      itemsTotal: priced.itemsTotal,
      discount: priced.discount,
      couponCode: priced.coupon?.code,
      shippingCharge: priced.shippingCharge,
      tax: priced.tax,
      total: priced.total,
      paymentMethod: method,
    });

    if (method === 'cod') {
      await deductStock(order);
      if (priced.coupon) await Coupon.updateOne({ _id: priced.coupon._id }, { $inc: { usedCount: 1 } });
    }
    res.status(201).json(order);
  })
);

export const deductStock = async (order) => {
  if (order.stockDeducted) return;
  for (const i of order.items) {
    await Product.updateOne({ _id: i.product, stock: { $gte: i.qty } }, { $inc: { stock: -i.qty, popularity: 5 } });
  }
  order.stockDeducted = true;
  await order.save();
};

router.get(
  '/mine',
  protect,
  asyncHandler(async (req, res) => {
    res.json(await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean());
  })
);

router.get(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(order);
  })
);

router.put(
  '/:id/cancel',
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!['placed', 'confirmed'].includes(order.status)) return res.status(400).json({ message: 'This order can no longer be cancelled' });
    order.status = 'cancelled';
    if (order.stockDeducted) {
      for (const i of order.items) await Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty } });
      order.stockDeducted = false;
    }
    if (order.paymentStatus === 'paid') order.paymentStatus = 'refunded'; // actual refund is processed from the Razorpay dashboard
    await order.save();
    res.json(order);
  })
);

export default router;
