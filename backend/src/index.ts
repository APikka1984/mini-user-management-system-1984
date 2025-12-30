// backend/src/index.ts
import "dotenv/config"; // must be before using process.env anywhere
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI!;
const PORT = process.env.PORT || 4000;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error", err);
  });

app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);

export default app;
