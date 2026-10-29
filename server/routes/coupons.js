import { Router } from 'express';
import { Coupon } from '../models/Misc.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import { evaluateCoupon } from '../utils/pricing.js';

const router = Router();

router.post(
  '/validate',
  asyncHandler(async (req, res) => {
    const { discount, coupon } = await evaluateCoupon(req.body.code, Number(req.body.itemsTotal) || 0);
    res.json({ code: coupon?.code, discount });
  })
);

router.get('/', protect, adminOnly, asyncHandler(async (_req, res) => res.json(await Coupon.find().sort({ createdAt: -1 }))));
router.post('/', protect, adminOnly, asyncHandler(async (req, res) => res.status(201).json(await Coupon.create(req.body))));
router.put(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const c = await Coupon.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Not found' });
    const { code, type, value, minOrder, maxDiscount, expiresAt, usageLimit, isActive } = req.body;
    Object.assign(c, { code, type, value, minOrder, maxDiscount, expiresAt, usageLimit, isActive });
    await c.save();
    res.json(c);
  })
);
router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => { await Coupon.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }));

export default router;
