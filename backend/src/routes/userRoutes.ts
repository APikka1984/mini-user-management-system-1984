import express from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  getAllUsers,
  activateUser,
  deactivateUser,
} from "../controllers/userController";

const router = express.Router();

// Admin-only
router.get("/users", requireAuth, requireRole("admin"), getAllUsers);
router.patch("/users/:id/activate", requireAuth, requireRole("admin"), activateUser);
router.patch("/users/:id/deactivate", requireAuth, requireRole("admin"), deactivateUser);

export default router;
