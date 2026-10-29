
import mongoose from 'mongoose';
import { slugify } from './Category.js';

export const MATERIALS = [
  'Cotton',
  'Organic Cotton',
  'Polyester',
  'Linen',
  'Denim',
  'Rayon',
  'Viscose',
  'Silk',
  'Satin',
  'Chiffon',
  'Georgette',
  'Wool',
  'Wool Blend',
  'Nylon',
  'Spandex',
  'Acrylic',
  'Leather',
  'Faux Leather',
  'Velvet',
  'Lace',
  'Crepe',
  'Other',
];

export const GENDERS = [
  'Women',
  'Men',
  
];

export const AGE_GROUPS = [
  'Adult',
  
];

export const CLOTHING_SIZES = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  'XXXL',
  'Free Size',
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

    // Clothing-specific attributes
    material: {
      type: String,
      enum: MATERIALS,
    },

    style: {
      type: String,
      trim: true,
    },

    occasion: [
      {
        type: String,
        trim: true,
      },
    ],

    gender: {
      type: String,
      enum: GENDERS,
      default: 'Women',
    },

    ageGroup: {
      type: String,
      enum: AGE_GROUPS,
      default: 'Adult',
    },

    sizes: [
      {
        type: String,
        trim: true,
      },
    ],

    // Clothing color options
    colors: [
      {
        type: String,
        trim: true,
      },
    ],

    // Optional fit information
    fit: {
      type: String,
      trim: true,
    },

    // Optional sleeve type, useful for tops and shirts
    sleeveType: {
      type: String,
      trim: true,
    },

    // Optional neckline information
    neckline: {
      type: String,
      trim: true,
    },

    // Product stock
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    deliveryInfo: {
      type: String,
      default: 'Delivered in 5-7 business days.',
      trim: true,
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
