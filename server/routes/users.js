import { Router } from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();
router.use(protect);

router.put(
  '/profile',
  asyncHandler(async (req, res) => {
    const { name, phone } = req.body;
    if (name) req.user.name = name;
    if (phone !== undefined) req.user.phone = phone;
    await req.user.save();
    res.json({ _id: req.user._id, name: req.user.name, email: req.user.email, phone: req.user.phone, role: req.user.role });
  })
);

router.put(
  '/password',
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters' });
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  })
);

// Addresses
router.get('/addresses', (req, res) => res.json(req.user.addresses));
router.post(
  '/addresses',
  asyncHandler(async (req, res) => {
    if (req.body.isDefault) req.user.addresses.forEach((a) => (a.isDefault = false));
    req.user.addresses.push(req.body);
    await req.user.save();
    res.status(201).json(req.user.addresses);
  })
);
router.put(
  '/addresses/:addrId',
  asyncHandler(async (req, res) => {
    const addr = req.user.addresses.id(req.params.addrId);
    if (!addr) return res.status(404).json({ message: 'Address not found' });
    if (req.body.isDefault) req.user.addresses.forEach((a) => (a.isDefault = false));
    addr.set(req.body);
    await req.user.save();
    res.json(req.user.addresses);
  })
);
router.delete(
  '/addresses/:addrId',
  asyncHandler(async (req, res) => {
    req.user.addresses.pull(req.params.addrId);
    await req.user.save();
    res.json(req.user.addresses);
  })
);

// Wishlist
router.get(
  '/wishlist',
  asyncHandler(async (req, res) => {
    res.json(await Product.find({ _id: { $in: req.user.wishlist }, isActive: true }).lean());
  })
);
router.post(
  '/wishlist/:productId',
  asyncHandler(async (req, res) => {
    await User.updateOne({ _id: req.user._id }, { $addToSet: { wishlist: req.params.productId } });
    res.json({ ok: true });
  })
);
router.delete(
  '/wishlist/:productId',
  asyncHandler(async (req, res) => {
    await User.updateOne({ _id: req.user._id }, { $pull: { wishlist: req.params.productId } });
    res.json({ ok: true });
  })
);

export default router;
