const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    brand:    { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['mobile', 'laptop', 'gaming', 'audio', 'tv', 'watch', 'camera', 'appliance', 'printer', 'network', 'storage', 'accessories']
    },
    price:    { type: Number, required: true, min: 0 },
    oldPrice: { type: Number, default: 0 },
    badge:    { type: String, default: '' },   // e.g. "NEW", "HOT", "-10%"
    image:    { type: String, default: '' },   // URL
    emoji:    { type: String, default: '📦' },
    description: { type: String, default: '' },
    stock:    { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
