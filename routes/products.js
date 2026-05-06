const express = require('express');
const router  = express.Router();
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ─── GET /api/products  — All active products (public) ──
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (search)   filter.name = { $regex: search, $options: 'i' };
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/products/all  — Admin: all products ────────
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/products  — Admin: add product ────────────
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, brand, category, price, oldPrice, badge, image, emoji, description, stock } = req.body;
    if (!name || !brand || !category || !price) {
      return res.status(400).json({ message: 'Name, brand, category and price are required' });
    }
    const product = await Product.create({ name, brand, category, price, oldPrice, badge, image, emoji, description, stock });
    res.status(201).json({ message: 'Product added!', product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/products/:id  — Admin: edit product ────────
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product updated!', product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE /api/products/:id  — Admin: delete product ───
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/products/:id/toggle  — Admin: active toggle ─
router.put('/:id/toggle', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    product.isActive = !product.isActive;
    await product.save();
    res.json({ message: `Product ${product.isActive ? 'activated' : 'deactivated'}!`, product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
