const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const Order   = require('../models/Order');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// ─── GET /api/admin/stats ─────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalOrders, totalProducts, orders] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Order.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.find().select('total status createdAt')
    ]);
    const totalRevenue = orders.filter(o => o.status === 'Delivered').reduce((s, o) => s + o.total, 0);
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    res.json({ totalUsers, totalOrders, totalProducts, totalRevenue, pendingOrders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/admin/users ─────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE /api/admin/users/:id ─────────────────────────
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) return res.status(400).json({ message: 'Cannot delete yourself' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/admin/orders ────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/admin/orders/:id/status ────────────────────
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.status = status;
    order.timeline.push({ status, message: `Order status updated to ${status}` });
    await order.save();
    res.json({ message: 'Status updated!', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/admin/make-admin ───────────────────────────
// Promote a user to admin by email
router.post('/make-admin', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: `${user.name} is now an admin!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
