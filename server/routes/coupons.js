import { Router } from 'express';
import { Coupon } from '../models/Misc.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import { evaluateCoupon } from '../utils/pricing.js';

const router = Router();

// Validate coupon during checkout
router.post(
  '/validate',
  asyncHandler(async (req, res) => {
    const { discount, coupon } = await evaluateCoupon(
      req.body.code,
      Number(req.body.itemsTotal) || 0
    );

    res.json({
      code: coupon?.code,
      discount,
    });
  })
);

// Public route: Get active coupons for homepage
// Keep this route before any /:id routes.
router.get(
  '/active',
  asyncHandler(async (_req, res) => {
    const now = new Date();

    const coupons = await Coupon.find({
      isActive: true,
      $and: [
        {
          $or: [
            { expiresAt: null },
            { expiresAt: { $gt: now } },
          ],
        },
        {
          $or: [
            { usageLimit: 0 },
            {
              $expr: {
                $lt: ['$usedCount', '$usageLimit'],
              },
            },
          ],
        },
      ],
    })
      .select('title code type value minOrder maxDiscount expiresAt')
      .sort({ updatedAt: -1 });

    res.set('Cache-Control', 'no-store');
    res.json(coupons);
  })
);

// Admin: Get all coupons
router.get(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (_req, res) => {
    const coupons = await Coupon.find().sort({
      createdAt: -1,
    });

    res.json(coupons);
  })
);

// Admin: Create coupon
router.post(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const coupon = await Coupon.create(req.body);

    res.status(201).json(coupon);
  })
);

// Admin: Update coupon
router.put(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        message: 'Coupon not found',
      });
    }

    const {
      title,
      code,
      type,
      value,
      minOrder,
      maxDiscount,
      expiresAt,
      usageLimit,
      isActive,
    } = req.body;

    Object.assign(coupon, {
      title,
      code,
      type,
      value,
      minOrder,
      maxDiscount,
      expiresAt,
      usageLimit,
      isActive,
    });

    await coupon.save();

    res.json(coupon);
  })
);

// Admin: Delete coupon
router.delete(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const coupon = await Coupon.findByIdAndDelete(
      req.params.id
    );

    if (!coupon) {
      return res.status(404).json({
        message: 'Coupon not found',
      });
    }

    res.json({
      message: 'Deleted',
    });
  })
);

export default router;