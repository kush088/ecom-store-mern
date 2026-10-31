
import mongoose from 'mongoose';

// Coupon Schema
const couponSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: '',
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['percent', 'flat'],
      default: 'percent',
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrder: {
      type: Number,
      default: 0,
    },
    maxDiscount: Number,
    expiresAt: Date,
    usageLimit: {
      type: Number,
      default: 0, // 0 = unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Banner Schema
const bannerSchema = new mongoose.Schema(
  {
    title: String,
    subtitle: String,
    ctaText: String,
    link: String,
    image: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Homepage Content Schema
const homeContentSchema = new mongoose.Schema(
  {
    promoVideo: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    promoVideoTitle: {
      type: String,
      default: '',
      trim: true,
    },
    promoVideoSubtitle: {
      type: String,
      default: '',
      trim: true,
    },
    promoVideoEnabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Message Schema
const messageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Subscriber Schema
const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Review Schema
const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: String,
  },
  { timestamps: true }
);

reviewSchema.index(
  { product: 1, user: 1 },
  { unique: true }
);

// Testimonial Schema
const testimonialSchema = new mongoose.Schema(
  {
    name: String,
    city: String,
    text: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Model Exports
export const Coupon = mongoose.model('Coupon', couponSchema);
export const Banner = mongoose.model('Banner', bannerSchema);
export const HomeContent = mongoose.model('HomeContent', homeContentSchema);
export const Message = mongoose.model('Message', messageSchema);
export const Subscriber = mongoose.model('Subscriber', subscriberSchema);
export const Review = mongoose.model('Review', reviewSchema);
export const Testimonial = mongoose.model('Testimonial', testimonialSchema);
