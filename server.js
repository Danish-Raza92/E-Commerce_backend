require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const morgan    = require("morgan");
const connectDB = require("./config/db");

// Connect to MongoDB Atlas
connectDB();

const app = express();

// CORS — sab allow (Railway + Vercel fix)
app.use(cors());
app.options("*", cors());

app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// API Routes
app.use("/api/auth",     require("./routes/auth"));
app.use("/api/orders",   require("./routes/orders"));
app.use("/api/products", require("./routes/products"));
app.use("/api/admin",    require("./routes/admin"));

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Danii.Store API is running!",
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

// Start
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Danii.Store Backend running on port " + PORT);
});

module.exports = app;
