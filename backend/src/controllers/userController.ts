import { Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { AuthedRequest } from "../middleware/auth";
import { verifyPassword, hashPassword } from "../utils/password";

// Admin: list users with pagination
export const getAllUsers = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-password"),
    User.countDocuments(),
  ]);

  return res.json({
    users,
    page,
    total,
    totalPages: Math.ceil(total / limit),
  });
};

// Admin: activate user
export const activateUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findByIdAndUpdate(
    id,
    { status: "active" },
    { new: true }
  ).select("-password");

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ user });
};

// Admin: deactivate user
export const deactivateUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findByIdAndUpdate(
    id,
    { status: "inactive" },
    { new: true }
  ).select("-password");

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ user });
};

// ===== User profile =====

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

// GET /api/profile
export const getProfile = async (req: AuthedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const user = await User.findById(req.user.userId).select("-password");
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ user });
};

// PUT /api/profile
export const updateProfile = async (req: AuthedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation error",
      details: parsed.error.issues,
    });
  }

  const { fullName, email } = parsed.data;

  const existing = await User.findOne({
    email,
    _id: { $ne: req.user.userId },
  });

  if (existing) {
    return res.status(409).json({ error: "Email already in use" });
  }

  const user = await User.findByIdAndUpdate(
    req.user.userId,
    { fullName, email },
    { new: true }
  ).select("-password");

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ user });
};

// PATCH /api/profile/change-password
export const changePassword = async (req: AuthedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation error",
      details: parsed.error.issues,
    });
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await User.findById(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const ok = await verifyPassword(currentPassword, user.password);
  if (!ok) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  user.password = await hashPassword(newPassword);
  await user.save();

  return res.json({ message: "Password updated successfully" });
};
