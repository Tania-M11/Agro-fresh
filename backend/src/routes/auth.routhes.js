import { Router } from "express";
import authentication from "../controllers/authentication.js";
import resetPassword from "../controllers/resetPassword.controller.js";

const router = Router();

// Rutas de autenticación
router.post("/register", authentication.register);
router.post("/login", authentication.login);
router.post("/reset-password", resetPassword.resetPassword);

export default router;
