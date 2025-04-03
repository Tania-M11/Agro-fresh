import express from "express";
import addressController from "../controllers/direccion.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.post("/addresses", authMiddleware, addressController.createAddress);
router.get("/addresses", authMiddleware, addressController.getUserAddresses);
router.put("/addresses/:addressId", authMiddleware, addressController.updateAddress);
router.delete("/addresses/:addressId", authMiddleware, addressController.deleteAddress);

export default router;