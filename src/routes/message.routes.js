import express from "express";
import { verifyTokenMiddleware } from "../middleware/verifyTokenMiddleware.js";
import { allMessages, sendMessage } from "../controllers/chat/message.controller.js";

const router = express.Router();

router.post("/", verifyTokenMiddleware, sendMessage);
router.get("/:chatId", verifyTokenMiddleware, allMessages);

export default router;
