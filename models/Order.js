const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId:  { type: String, required: true },
  name:       { type: String, required: true },
  price:      { type: Number, required: true },
  quantity:   { type: Number, required: true, min: 1 },
  image:      { type: String, default: '' }
});

const orderSchema = new mongoose.Schema(
  {
    orderId:     { type: String, unique: true },   // e.g. "ORD-2025-XXXXX"
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userEmail:   { type: String, required: true },
    items:       [orderItemSchema],
    shipping: {
      name:    { type: String, required: true },
      address: { type: String, required: true },
      city:    { type: String, required: true },
      phone:   { type: String, required: true }
    },
    subtotal:    { type: Number, required: true },
    shippingFee: { type: Number, default: 200 },
    total:       { type: Number, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Pending'
    },
    paymentMethod: { type: String, default: 'Cash on Delivery' },
    timeline: [
      {
        status:    String,
        message:   String,
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

// Auto-generate orderId before saving
orderSchema.pre('save', function (next) {
  if (!this.orderId) {
    const rand = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.orderId = `ORD-${new Date().getFullYear()}-${rand}`;
    // Initial timeline entry
    this.timeline = [{ status: 'Pending', message: 'Order placed successfully' }];
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
