
import mongoose from 'mongoose';
import { slugify } from './Category.js';

export const MATERIALS = [
  'Gold',
  'Diamond',
  'Silver',
  'Platinum',
  'Rose Gold',
  'White Gold',
  'Brass',
  'Alloy',
  'Kundan',
  'Polki',
  'Pearl',
  'Other',
];

export const PURITIES = [
  '14K',
  '18K',
  '22K',
  '24K',
  '925 Sterling',
];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      index: true,
    },

    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },

    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      index: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    mrp: {
      type: Number,
      min: 0,
    },

    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 90,
    },

    // Product images hosted on Cloudinary
    images: [
      {
        url: {
          type: String,
          trim: true,
        },
        publicId: {
          type: String,
          trim: true,
        },
      },
    ],

    // Optional product video hosted on Cloudinary
    video: {
      url: {
        type: String,
        default: '',
        trim: true,
      },
      publicId: {
        type: String,
        default: '',
        trim: true,
      },
    },

    // Jewellery-specific attributes
    material: {
      type: String,
      enum: MATERIALS,
    },

    purity: {
      type: String,
      enum: PURITIES,
    },

    weightGrams: {
      type: Number,
      min: 0,
    },

    diamond: {
      carat: Number,
      clarity: String,
      color: String,
      cut: String,
    },

    gemstone: String,
    style: String,
    occasion: [String],

    gender: {
      type: String,
      enum: ['Women', 'Men', 'Unisex', 'Kids'],
      default: 'Women',
    },

    ageGroup: {
      type: String,
      enum: ['Adult', 'Kids', 'Teen'],
      default: 'Adult',
    },

    sizes: [String],

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    deliveryInfo: {
      type: String,
      default: 'Delivered in 5-7 business days. Insured shipping.',
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isBestseller: {
      type: Boolean,
      default: false,
    },

    isNewArrival: {
      type: Boolean,
      default: false,
    },

    isTrending: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    popularity: {
      type: Number,
      default: 0,
    },

    ratingAvg: {
      type: Number,
      default: 0,
    },

    ratingCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Search index
productSchema.index({
  name: 'text',
  description: 'text',
  style: 'text',
  gemstone: 'text',
  material: 'text',
});

// Generate slug and calculate discount
productSchema.pre('validate', function () {
  if (!this.slug || this.isModified('name')) {
    this.slug = `${slugify(this.name)}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;
  }

  if (this.mrp && this.mrp > this.price) {
    this.discountPercent = Math.round(
      ((this.mrp - this.price) / this.mrp) * 100
    );
  } else {
    this.discountPercent = 0;
  }
});

export default mongoose.model('Product', productSchema);
