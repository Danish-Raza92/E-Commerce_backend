const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ─── POST /api/orders  — Place new order ─────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { items, shipping, subtotal, shippingFee, total, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    const order = await Order.create({
      user:      req.user._id,
      userEmail: req.user.email,
      items,
      shipping,
      subtotal,
      shippingFee: shippingFee || 200,
      total,
      paymentMethod: paymentMethod || 'Cash on Delivery'
    });

    res.status(201).json({ message: 'Order placed!', order });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/orders/my  — My orders ─────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/orders/track/:orderId  — Track by orderId ──
router.get('/track/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ message: 'Order not found. Check your order ID.' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/orders  — All orders (admin) ───────────────
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PUT /api/orders/:id/status  — Update status (admin) ─
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status, message } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    order.timeline.push({ status, message: message || `Order ${status}` });
    await order.save();

    res.json({ message: 'Status updated', order });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
