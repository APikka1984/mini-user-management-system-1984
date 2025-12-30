import { Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { hashPassword, verifyPassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { AuthedRequest } from "../middleware/auth";

const signupSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const signup = async (req: Request, res: Response) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation error",
      details: parsed.error.issues,
    });
  }

  const { fullName, email, password } = parsed.data;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ error: "Email already in use" });
  }

  const hashed = await hashPassword(password);

  const user = await User.create({
    fullName,
    email,
    password: hashed,
    role: "user",
    status: "active",
  });

  const userId = user._id.toString();

  const token = signToken({
    userId,
    role: user.role,
  });

  return res.status(201).json({
    user: {
      id: userId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
    token,
  });
};

export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation error",
      details: parsed.error.issues,
    });
  }

  const { email, password } = parsed.data;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  if (user.status === "inactive") {
    return res.status(403).json({ error: "Account is inactive" });
  }

  const isMatch = await verifyPassword(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  user.lastLogin = new Date();
  await user.save();

  const userId = user._id.toString();

  const token = signToken({
    userId,
    role: user.role,
  });

  return res.json({
    user: {
      id: userId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
    token,
  });
};

export const me = async (req: AuthedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const user = await User.findById(req.user.userId).select("-password");
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ user });
};

export const logout = async (_req: AuthedRequest, res: Response) => {
  // Stateless JWT: client removes token; no server-side session to destroy.
  return res.status(200).json({ message: "Logged out successfully" });
};
