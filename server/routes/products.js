
import { Router } from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { Review } from '../models/Misc.js';
import Order from '../models/Order.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

const csv = (v) =>
  v
    ? String(v)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

// Build a MongoDB filter from query parameters.
const buildFilter = async (q) => {
  const f = { isActive: true };

  if (q.category) {
    const cat = await Category.findOne({ slug: q.category });

    if (cat) {
      const ids = [
        cat._id,
        ...(await Category.find({ parent: cat._id }).distinct('_id')),
      ];

      f.$or = [
        { category: { $in: ids } },
        { subcategory: { $in: ids } },
      ];
    } else {
      f._id = null;
    }
  }

  if (q.subcategory) {
    const sub = await Category.findOne({ slug: q.subcategory });
    f.subcategory = sub ? sub._id : null;
  }

  if (q.minPrice || q.maxPrice) {
    f.price = {};
    if (q.minPrice) f.price.$gte = Number(q.minPrice);
    if (q.maxPrice) f.price.$lte = Number(q.maxPrice);
  }

  if (q.material) f.material = { $in: csv(q.material) };
  if (q.purity) f.purity = { $in: csv(q.purity) };

  if (q.gemstone) {
    f.gemstone = {
      $in: csv(q.gemstone).map((g) => new RegExp(`^${g}$`, 'i')),
    };
  }

  if (q.style) {
    f.style = {
      $in: csv(q.style).map((g) => new RegExp(`^${g}$`, 'i')),
    };
  }

  if (q.occasion) f.occasion = { $in: csv(q.occasion) };
  if (q.gender) f.gender = { $in: csv(q.gender) };
  if (q.ageGroup) f.ageGroup = { $in: csv(q.ageGroup) };
  if (q.size) f.sizes = { $in: csv(q.size) };

  if (q.minCarat || q.maxCarat) {
    f['diamond.carat'] = {};
    if (q.minCarat) f['diamond.carat'].$gte = Number(q.minCarat);
    if (q.maxCarat) f['diamond.carat'].$lte = Number(q.maxCarat);
  }

  if (q.clarity) f['diamond.clarity'] = { $in: csv(q.clarity) };
  if (q.stock === 'in') f.stock = { $gt: 0 };
  if (q.stock === 'out') f.stock = 0;

  if (
    q.flag &&
    ['isFeatured', 'isBestseller', 'isNewArrival', 'isTrending'].includes(
      q.flag
    )
  ) {
    f[q.flag] = true;
  }

  if (q.search) {
    const rx = new RegExp(
      String(q.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i'
    );

    const matchingCats = await Category.find({ name: rx }).distinct('_id');

    const or = [
      { name: rx },
      { material: rx },
      { style: rx },
      { gemstone: rx },
      { description: rx },
      { occasion: rx },
      { category: { $in: matchingCats } },
      { subcategory: { $in: matchingCats } },
    ];

    f.$and = [...(f.$and || []), { $or: or }];
  }

  return f;
};

const SORTS = {
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  newest: { createdAt: -1 },
  popularity: { popularity: -1, ratingCount: -1 },
  featured: { isFeatured: -1, popularity: -1 },
};

// Public product listing
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(48, Number(req.query.limit) || 12);
    const filter = await buildFilter(req.query);
    const sort = SORTS[req.query.sort] || SORTS.featured;

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('category subcategory', 'name slug')
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  })
);

// Filter options
router.get(
  '/facets',
  asyncHandler(async (req, res) => {
    const base = await buildFilter({
      category: req.query.category,
      search: req.query.search,
    });

    const [
      materials,
      purities,
      gemstones,
      styles,
      occasions,
      sizes,
      clarities,
      price,
    ] = await Promise.all([
      Product.distinct('material', base),
      Product.distinct('purity', base),
      Product.distinct('gemstone', base),
      Product.distinct('style', base),
      Product.distinct('occasion', base),
      Product.distinct('sizes', base),
      Product.distinct('diamond.clarity', base),
      Product.aggregate([
        { $match: base },
        {
          $group: {
            _id: null,
            min: { $min: '$price' },
            max: { $max: '$price' },
          },
        },
      ]),
    ]);

    const clean = (values) => values.filter(Boolean).sort();

    res.json({
      materials: clean(materials),
      purities: clean(purities),
      gemstones: clean(gemstones),
      styles: clean(styles),
      occasions: clean(occasions),
      sizes: clean(sizes),
      clarities: clean(clarities),
      price: price[0]
        ? { min: price[0].min, max: price[0].max }
        : { min: 0, max: 0 },
    });
  })
);

// Homepage product collections
router.get(
  '/home',
  asyncHandler(async (_req, res) => {
    const pick = (flag) =>
      Product.find({ isActive: true, [flag]: true })
        .sort({ updatedAt: -1 })
        .limit(8)
        .lean();

    const [featured, bestsellers, newArrivals, trending] = await Promise.all([
      pick('isFeatured'),
      pick('isBestseller'),
      pick('isNewArrival'),
      pick('isTrending'),
    ]);

    res.json({ featured, bestsellers, newArrivals, trending });
  })
);

// Single product and related items
router.get(
  '/slug/:slug',
  asyncHandler(async (req, res) => {
    const p = await Product.findOne({
      slug: req.params.slug,
      isActive: true,
    })
      .populate('category subcategory', 'name slug')
      .lean();

    if (!p) {
      return res.status(404).json({ message: 'Product not found' });
    }

    Product.updateOne(
      { _id: p._id },
      { $inc: { popularity: 1 } }
    ).exec();

    const categoryId = p.category?._id || p.category;

    const [related, reviews] = await Promise.all([
      categoryId
        ? Product.find({
            isActive: true,
            _id: { $ne: p._id },
            category: categoryId,
          })
            .limit(4)
            .lean()
        : [],
      Review.find({ product: p._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    res.json({ product: p, related, reviews });
  })
);

// Submit a review
router.post(
  '/:id/reviews',
  protect,
  asyncHandler(async (req, res) => {
    const bought = await Order.exists({
      user: req.user._id,
      'items.product': req.params.id,
      status: 'delivered',
    });

    if (!bought) {
      return res.status(403).json({
        message: 'Only customers who received this product can review it',
      });
    }

    const { rating, comment } = req.body;

    await Review.findOneAndUpdate(
      { product: req.params.id, user: req.user._id },
      {
        rating: Number(rating),
        comment,
        name: req.user.name,
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const agg = await Review.aggregate([
      { $match: { product: product._id } },
      {
        $group: {
          _id: null,
          avg: { $avg: '$rating' },
          n: { $sum: 1 },
        },
      },
    ]);

    await Product.findByIdAndUpdate(req.params.id, {
      ratingAvg: agg[0]?.avg || 0,
      ratingCount: agg[0]?.n || 0,
    });

    res.status(201).json({ message: 'Review saved' });
  })
);

// Bulk fetch for cart and wishlist
router.post(
  '/by-ids',
  asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body.ids)
      ? req.body.ids.slice(0, 100)
      : [];

    res.json(
      await Product.find({
        _id: { $in: ids },
        isActive: true,
      }).lean()
    );
  })
);

// ---------- Admin ----------

// Added "video" so the API can accept video metadata.
const ALLOWED = [
  'name',
  'sku',
  'description',
  'category',
  'subcategory',
  'price',
  'mrp',
  'images',
  'video',
  'material',
  'purity',
  'weightGrams',
  'diamond',
  'gemstone',
  'style',
  'occasion',
  'gender',
  'ageGroup',
  'sizes',
  'stock',
  'deliveryInfo',
  'isFeatured',
  'isBestseller',
  'isNewArrival',
  'isTrending',
  'isActive',
];

const pickAllowed = (body) => {
  const data = {};

  for (const k of ALLOWED) {
    if (body[k] !== undefined) data[k] = body[k];
  }

  // Avoid passing empty strings to enum/ObjectId validators.
  for (const k of ['material', 'purity', 'subcategory', 'sku']) {
    if (data[k] === '') data[k] = undefined;
  }

  return data;
};

// Admin product listing
router.get(
  '/admin/list',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = 20;
    const filter = {};

    if (req.query.search) {
      filter.name = new RegExp(
        String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );
    }

    if (req.query.lowStock) {
      filter.stock = { $lte: 5 };
    }

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('category subcategory', 'name')
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  })
);

// Admin get one product
router.get(
  '/admin/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const p = await Product.findById(req.params.id).lean();

    if (!p) {
      return res.status(404).json({ message: 'Not found' });
    }

    res.json(p);
  })
);

// Create product
router.post(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const product = await Product.create(pickAllowed(req.body));
    res.status(201).json(product);
  })
);

// Update product
router.put(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const p = await Product.findById(req.params.id);

    if (!p) {
      return res.status(404).json({ message: 'Not found' });
    }

    p.set(pickAllowed(req.body));
    await p.save();

    res.json(p);
  })
);

// Delete product
router.delete(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  })
);

export default router;
  