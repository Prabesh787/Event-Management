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
} from "../controllers/auth/auth.controller.js";
import { verifyTokenMiddleware } from "../middleware/verifyTokenMiddleware.js";
// const {
//   registerUser,
//   authUser,
//   allUsers,
//   getUserById,
// } = require("../controllers/auth/user.controller");

const router = express.Router();

router.get("/check-auth", verifyTokenMiddleware, checkAuth);
router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logout);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.get("/user", verifyTokenMiddleware, allUsers);
// router.route("/:id").get(protect, getUserById);

export default router;
