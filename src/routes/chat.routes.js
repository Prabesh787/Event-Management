import express from "express";
import {
  accessChat,
  fetchChat,
  createGroup,
  renameGroup,
  addToGroup,
  removeFromGroup,
} from "../controllers/chat/chat.controller.js";
import { verifyTokenMiddleware } from "../middleware/verifyTokenMiddleware.js";

const router = express.Router();

router.post("/accessChat", verifyTokenMiddleware, accessChat);
router.get("/fetchChat", verifyTokenMiddleware, fetchChat);
router.post("/createGroup", verifyTokenMiddleware, createGroup);
router.put("/renameGroup", verifyTokenMiddleware, renameGroup);
router.put("/groupadd", verifyTokenMiddleware, addToGroup);
router.put("/groupremove", verifyTokenMiddleware, removeFromGroup);

export default router;
