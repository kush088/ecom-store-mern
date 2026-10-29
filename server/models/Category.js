import mongoose from 'mongoose';

export const slugify = (s) =>
  s.toLowerCase().replace(/&/g, 'and').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    // null parent => top-level category; otherwise a subcategory
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    description: String,
    image: { url: String, publicId: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.pre('validate', function (next) {
  if (!this.slug || this.isModified('name')) this.slug = slugify(this.name);
  next();
});

export default mongoose.model('Category', categorySchema);
