import express from "express";
import { getOrders, addOrder } from "../controllers/Order.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication middleware to both routes
router.get("/", authMiddleware, getOrders);
router.post("/", authMiddleware, addOrder);

export default router;