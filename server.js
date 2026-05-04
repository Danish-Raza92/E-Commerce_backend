require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const morgan    = require('morgan');
const connectDB = require('./config/db');

// Connect to MongoDB Atlas
connectDB();

const app = express();

// ─── CORS — Allow Vercel frontend ───────────────────────
const allowedOrigins = [
  'https://e-commerce-frontend-theta-orpin.vercel.app',
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5500',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (curl, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS: Origin not allowed — ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── API Routes ──────────────────────────────────────────
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));

// ─── Health Check ────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: '🚀 Danii.Store API is running!',
    env: process.env.NODE_ENV || 'development',
    time: new Date().toISOString()
  });
});

// ─── 404 Handler ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// ─── Error Handler ───────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// ─── Start ───────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Danii.Store Backend on port ${PORT}`);
  console.log(`📦 Env: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS allowed: ${allowedOrigins.join(', ')}\n`);
});

module.exports = app;
