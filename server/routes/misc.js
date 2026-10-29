
import { Router } from 'express';
import { body } from 'express-validator';
import {
  Banner,
  HomeContent,
  Message,
  Subscriber,
  Testimonial,
} from '../models/Misc.js';
import { asyncHandler, validate } from '../middleware/error.js';

const router = Router();

// Get active homepage banners
router.get(
  '/banners',
  asyncHandler(async (_req, res) => {
    const banners = await Banner.find({ isActive: true })
      .sort({ order: 1 })
      .lean();

    res.json(banners);
  })
);

// Get active testimonials
router.get(
  '/testimonials',
  asyncHandler(async (_req, res) => {
    const testimonials = await Testimonial.find({ isActive: true })
      .limit(9)
      .lean();

    res.json(testimonials);
  })
);

// Get homepage promotional video settings
router.get(
  '/home-content',
  asyncHandler(async (_req, res) => {
    const content = await HomeContent.findOne().lean();

    res.json(
      content || {
        promoVideo: { url: '', publicId: '' },
        promoVideoTitle: '',
        promoVideoSubtitle: '',
        promoVideoEnabled: false,
      }
    );
  })
);

// Submit contact form
router.post(
  '/contact',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required'),
    body('email')
      .isEmail()
      .withMessage('Valid email required'),
    body('message')
      .trim()
      .isLength({ min: 10 })
      .withMessage('Message must be at least 10 characters'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, phone, message } = req.body;

    await Message.create({
      name,
      email,
      phone,
      message,
    });

    res.status(201).json({
      message: 'Thanks! We will get back to you shortly.',
    });
  })
);

// Subscribe to newsletter
router.post(
  '/newsletter',
  [
    body('email')
      .isEmail()
      .withMessage('Valid email required')
      .normalizeEmail(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    await Subscriber.updateOne(
      { email: req.body.email },
      { $set: { email: req.body.email } },
      { upsert: true }
    );

    res.status(201).json({
      message: 'Subscribed! Welcome to the family.',
    });
  })
);

export default router;
