import { Router } from "express";
import ProfileController from "../controllers/profile.controller.js";
import authMiddleware from "../middleware/authMiddleware.js"; // Este middleware deberás crearlo

const router = Router();

// Aplicar middleware de autenticación a las rutas del perfil
router.get("/profile", authMiddleware, ProfileController.getProfile);
router.put("/profile/update", authMiddleware, ProfileController.updateProfile);

export default router;