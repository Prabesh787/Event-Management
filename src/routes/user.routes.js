import express from "express";
import {
  checkAuth,
  login,
  logout,
  signup,
  verifyEmail,
  forgotPassword,
  resetPassword,
  allUsers,
  updateProfilePicture,
} from "../controllers/auth/auth.controller.js";
import { verifyTokenMiddleware } from "../middleware/verifyTokenMiddleware.js";
import { googleAuth } from "../controllers/auth/googleAuth.controller.js";
import { uploadProfilePic } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/google", googleAuth);

router.get("/check-auth", verifyTokenMiddleware, checkAuth);
router.patch(
  "/profile-picture",
  verifyTokenMiddleware,
  (req, res, next) => {
    uploadProfilePic(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Invalid file (max 5MB, images only)",
        });
      }
      next();
    });
  },
  updateProfilePicture
);
router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logout);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.get("/user", verifyTokenMiddleware, allUsers);
// router.route("/:id").get(protect, getUserById);

export default router;
