import express from 'express';
import { createSession } from '../controllers/payment.controller.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Route for creating Stripe Checkout Session
router.post('/create-checkout-session', authMiddleware, createSession);

export default router;
