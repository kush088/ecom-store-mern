import { Router } from 'express';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

// Public: nested tree (parents with children), active only
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const all = await Category.find({ isActive: true }).sort({ order: 1, name: 1 }).lean();
    const parents = all.filter((c) => !c.parent);
    const tree = parents.map((p) => ({
      ...p,
      children: all.filter((c) => c.parent && String(c.parent) === String(p._id)),
    }));
    res.json(tree);
  })
);

// Admin: flat list including inactive
router.get(
  '/all',
  protect,
  adminOnly,
  asyncHandler(async (_req, res) => {
    res.json(await Category.find().sort({ order: 1, name: 1 }).lean());
  })
);

router.get(
  '/slug/:slug',
  asyncHandler(async (req, res) => {
    const cat = await Category.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    const children = await Category.find({ parent: cat._id, isActive: true }).sort({ order: 1 }).lean();
    const parent = cat.parent ? await Category.findById(cat.parent).lean() : null;
    res.json({ ...cat, children, parentDoc: parent });
  })
);

router.post(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { name, parent, description, image, order, isActive } = req.body;
    const cat = await Category.create({ name, parent: parent || null, description, image, order, isActive });
    res.status(201).json(cat);
  })
);

// Bulk reorder: body { items: [{ id, order }] }
router.put(
  '/reorder',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    await Category.bulkWrite(items.map((i) => ({ updateOne: { filter: { _id: i.id }, update: { order: i.order } } })));
    res.json({ message: 'Reordered' });
  })
);

router.put(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    const { name, parent, description, image, order, isActive } = req.body;
    if (parent && String(parent) === String(cat._id)) return res.status(400).json({ message: 'A category cannot be its own parent' });
    if (name !== undefined) cat.name = name;
    if (parent !== undefined) cat.parent = parent || null;
    if (description !== undefined) cat.description = description;
    if (image !== undefined) cat.image = image;
    if (order !== undefined) cat.order = order;
    if (isActive !== undefined) cat.isActive = isActive;
    await cat.save();
    res.json(cat);
  })
);

router.delete(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const children = await Category.countDocuments({ parent: req.params.id });
    if (children) return res.status(400).json({ message: 'Delete or move its subcategories first' });
    const used = await Product.countDocuments({ $or: [{ category: req.params.id }, { subcategory: req.params.id }] });
    if (used) return res.status(400).json({ message: `${used} product(s) use this category. Reassign them first.` });
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  })
);

export default router;
