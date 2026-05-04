const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Helper: generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ─── POST /api/auth/register ──────────────────────────────
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    try {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: 'Email already registered' });

      const user = await User.create({ name, email, password });
      res.status(201).json({
        message: 'Account created successfully!',
        token: generateToken(user._id),
        user
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// ─── POST /api/auth/login ─────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      res.json({
        message: 'Login successful!',
        token: generateToken(user._id),
        user
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// ─── GET /api/auth/me ─────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// ─── PUT /api/auth/profile ────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name  = req.body.name  || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    if (req.body.password) user.password = req.body.password;

    const updated = await user.save();
    res.json({ message: 'Profile updated!', user: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/auth/addresses ─────────────────────────────
router.post('/addresses', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { label, name, street, city, phone, isDefault } = req.body;

    if (!label || !name || !street || !city) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (isDefault) {
      user.addresses.forEach(a => (a.isDefault = false));
    }

    user.addresses.push({ label, name, street, city, phone, isDefault: !!isDefault });
    await user.save();
    res.status(201).json({ message: 'Address saved!', addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── DELETE /api/auth/addresses/:id ──────────────────────
router.delete('/addresses/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.id);
    await user.save();
    res.json({ message: 'Address deleted', addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PUT /api/auth/wishlist ───────────────────────────────
router.put('/wishlist', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { productId } = req.body;
    const idx = user.wishlist.indexOf(productId);
    if (idx === -1) {
      user.wishlist.push(productId);
    } else {
      user.wishlist.splice(idx, 1);
    }
    await user.save();
    res.json({ wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
