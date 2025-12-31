import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();

// Middleware
app.use(cors({
  origin::  ['https://mini-user-frontend.vercel.app', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());


// Health check
app.get("/health", (req, res) => {
  res.json({ message: "Mini User Management API", status: "running" });
});

// Home route
app.get('/', (req, res) => {
  res.json({ message: 'Mini User Management API', status: 'running' });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);

const MONGO_URI = process.env.MONGO_URI!;
const PORT = process.env.PORT || 4000;

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error('MongoDB connection error', err);
  });

// For local development only
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel serverless
export default app;
