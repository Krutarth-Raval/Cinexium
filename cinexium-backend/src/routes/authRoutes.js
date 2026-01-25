import express, { Router } from "express";
import {
  changePasswordController,
  deleteAccountRequestController,
  forgotPasswordController,
  loginController,
  logoutController,
  profileController,
  resetPasswordController,
  signupController,
  updateProfileController,
} from "../controllers/authController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/signup", signupController);
router.post("/login", loginController);
router.post("/account/delete-request", authMiddleware, deleteAccountRequestController)

router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);

router.get("/profile", authMiddleware, profileController);
router.put("/profile/update-name", authMiddleware, updateProfileController);
router.put(
  "/profile/change-password",
  authMiddleware,
  changePasswordController
);
router.post("/logout", authMiddleware, logoutController);

export default router;
