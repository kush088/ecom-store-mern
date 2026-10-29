import { Router } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order.js';
import { Coupon } from '../models/Misc.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import { deductStock } from './orders.js';

const router = Router();

const razorpay = () =>
  new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });

// Create a Razorpay order for one of the user's pending orders
router.post(
  '/razorpay/create',
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.body.orderId, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.paymentStatus === 'paid') return res.status(400).json({ message: 'Order already paid' });
    const rzp = await razorpay().orders.create({
      amount: Math.round(order.total * 100), // paise
      currency: 'INR',
      receipt: order.orderNumber,
    });
    order.razorpayOrderId = rzp.id;
    await order.save();
    res.json({ keyId: process.env.RAZORPAY_KEY_ID, razorpayOrderId: rzp.id, amount: rzp.amount, currency: rzp.currency, orderId: order._id });
  })
);

// Verify signature server-side before marking as paid
router.post(
  '/razorpay/verify',
  protect,
  asyncHandler(async (req, res) => {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order || order.razorpayOrderId !== razorpay_order_id) return res.status(404).json({ message: 'Order not found' });

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(String(razorpay_signature || ''));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      order.paymentStatus = 'failed';
      await order.save();
      return res.status(400).json({ message: 'Payment verification failed' });
    }
    if (order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      order.razorpayPaymentId = razorpay_payment_id;
      await order.save();
      await deductStock(order);
      if (order.couponCode) await Coupon.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } });
    }
    res.json(order);
  })
);

router.post(
  '/razorpay/failed',
  protect,
  asyncHandler(async (req, res) => {
    await Order.updateOne({ _id: req.body.orderId, user: req.user._id, paymentStatus: 'pending' }, { paymentStatus: 'failed' });
    res.json({ ok: true });
  })
);

export default router;
