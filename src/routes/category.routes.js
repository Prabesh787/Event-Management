import express from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/event/category.controller.js";
import { verifyTokenMiddleware } from "../middleware/verifyTokenMiddleware.js";

const router = express.Router();

router.get("/", getAllCategories);
router.get("/:id", getCategoryById);
router.post("/", verifyTokenMiddleware, createCategory);
router.put("/:id", verifyTokenMiddleware, updateCategory);
router.delete("/:id", verifyTokenMiddleware, deleteCategory);

export default router;
