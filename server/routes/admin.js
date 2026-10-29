
import { Router } from 'express';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import {
  Banner,
  HomeContent,
  Message,
  Subscriber,
  Testimonial,
} from '../models/Misc.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

router.use(protect, adminOnly);

const esc = (s) =>
  new RegExp(
    String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    'i'
  );

// Dashboard statistics
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const paidMatch = {
      paymentStatus: 'paid',
      status: { $ne: 'cancelled' },
    };

    const [
      revenueAgg,
      totalOrders,
      totalUsers,
      totalProducts,
      lowStock,
      pendingOrders,
      recentOrders,
      daily,
      topProducts,
      unread,
    ] = await Promise.all([
      Order.aggregate([
        { $match: paidMatch },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Product.countDocuments(),
      Product.find({ stock: { $lte: 5 }, isActive: true })
        .select('name stock')
        .limit(10)
        .lean(),
      Order.countDocuments({
        status: { $in: ['placed', 'confirmed'] },
      }),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('user', 'name')
        .lean(),
      Order.aggregate([
        {
          $match: {
            ...paidMatch,
            createdAt: { $gte: since },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
                timezone: 'Asia/Kolkata',
              },
            },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: paidMatch },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            name: { $first: '$items.name' },
            sold: { $sum: '$items.qty' },
          },
        },
        { $sort: { sold: -1 } },
        { $limit: 5 },
      ]),
      Message.countDocuments({ isRead: false }),
    ]);

    res.json({
      revenue: revenueAgg[0]?.total || 0,
      totalOrders,
      totalUsers,
      totalProducts,
      pendingOrders,
      lowStock,
      recentOrders,
      daily,
      topProducts,
      unreadMessages: unread,
    });
  })
);

// Orders
router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.search) {
      filter.orderNumber = esc(req.query.search);
    }

    const [items, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * 20)
        .limit(20)
        .populate('user', 'name email')
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page,
      pages: Math.ceil(total / 20),
    });
  })
);

router.put(
  '/orders/:id',
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Not found' });
    }

    const { status, trackingNumber, paymentStatus } = req.body;

    if (
      status &&
      ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(
        status
      )
    ) {
      if (
        status === 'cancelled' &&
        order.status !== 'cancelled' &&
        order.stockDeducted
      ) {
        for (const item of order.items) {
          await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.qty } }
          );
        }

        order.stockDeducted = false;
      }

      order.status = status;

      if (status === 'delivered' && order.paymentMethod === 'cod') {
        order.paymentStatus = 'paid';
      }
    }

    if (trackingNumber !== undefined) {
      order.trackingNumber = trackingNumber;
    }

    if (
      paymentStatus &&
      ['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)
    ) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();
    res.json(order);
  })
);

// Users
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);

    const [items, total] = await Promise.all([
      User.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * 20)
        .limit(20)
        .select('-addresses -wishlist')
        .lean(),
      User.countDocuments(),
    ]);

    res.json({
      items,
      total,
      page,
      pages: Math.ceil(total / 20),
    });
  })
);

router.put(
  '/users/:id',
  asyncHandler(async (req, res) => {
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({
        message: 'You cannot change your own account here',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: !!req.body.isActive },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  })
);

// Homepage banners
router.get(
  '/banners',
  asyncHandler(async (_req, res) => {
    res.json(await Banner.find().sort({ order: 1 }));
  })
);

router.post(
  '/banners',
  asyncHandler(async (req, res) => {
    res.status(201).json(await Banner.create(req.body));
  })
);

router.put(
  '/banners/:id',
  asyncHandler(async (req, res) => {
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    res.json(banner);
  })
);

router.delete(
  '/banners/:id',
  asyncHandler(async (req, res) => {
    const banner = await Banner.findByIdAndDelete(req.params.id);

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    res.json({ message: 'Deleted' });
  })
);

// Homepage promotional video settings
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

router.put(
  '/home-content',
  asyncHandler(async (req, res) => {
    const {
      promoVideo,
      promoVideoTitle,
      promoVideoSubtitle,
      promoVideoEnabled,
    } = req.body;

    if (
      promoVideo !== undefined &&
      (typeof promoVideo !== 'object' ||
        promoVideo === null ||
        Array.isArray(promoVideo))
    ) {
      return res.status(400).json({
        message: 'Invalid promotional video details',
      });
    }

    if (
      promoVideoTitle !== undefined &&
      typeof promoVideoTitle !== 'string'
    ) {
      return res.status(400).json({
        message: 'Video title must be text',
      });
    }

    if (
      promoVideoSubtitle !== undefined &&
      typeof promoVideoSubtitle !== 'string'
    ) {
      return res.status(400).json({
        message: 'Video subtitle must be text',
      });
    }

    if (
      promoVideoEnabled !== undefined &&
      typeof promoVideoEnabled !== 'boolean'
    ) {
      return res.status(400).json({
        message: 'Video enabled status must be true or false',
      });
    }

    const update = {};

    if (promoVideo !== undefined) {
      if (
        promoVideo.url !== undefined &&
        typeof promoVideo.url !== 'string'
      ) {
        return res.status(400).json({
          message: 'Invalid promotional video URL',
        });
      }

      if (
        promoVideo.publicId !== undefined &&
        typeof promoVideo.publicId !== 'string'
      ) {
        return res.status(400).json({
          message: 'Invalid promotional video public ID',
        });
      }

      update['promoVideo.url'] = promoVideo.url ?? '';
      update['promoVideo.publicId'] = promoVideo.publicId ?? '';
    }

    if (promoVideoTitle !== undefined) {
      update.promoVideoTitle = promoVideoTitle.trim();
    }

    if (promoVideoSubtitle !== undefined) {
      update.promoVideoSubtitle = promoVideoSubtitle.trim();
    }

    if (promoVideoEnabled !== undefined) {
      update.promoVideoEnabled = promoVideoEnabled;
    }

    const content = await HomeContent.findOneAndUpdate(
      {},
      { $set: update },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json(content);
  })
);

// Testimonials
router.get(
  '/testimonials',
  asyncHandler(async (_req, res) => {
    res.json(await Testimonial.find().sort({ createdAt: -1 }));
  })
);

router.post(
  '/testimonials',
  asyncHandler(async (req, res) => {
    res.status(201).json(await Testimonial.create(req.body));
  })
);

router.delete(
  '/testimonials/:id',
  asyncHandler(async (req, res) => {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        message: 'Testimonial not found',
      });
    }

    res.json({ message: 'Deleted' });
  })
);

// Messages and subscribers
router.get(
  '/messages',
  asyncHandler(async (_req, res) => {
    res.json(
      await Message.find().sort({ createdAt: -1 }).limit(200)
    );
  })
);

router.put(
  '/messages/:id/read',
  asyncHandler(async (req, res) => {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json(message);
  })
);

router.delete(
  '/messages/:id',
  asyncHandler(async (req, res) => {
    const message = await Message.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ message: 'Deleted' });
  })
);

router.get(
  '/subscribers',
  asyncHandler(async (_req, res) => {
    res.json(await Subscriber.find().sort({ createdAt: -1 }));
  })
);

export default router;
