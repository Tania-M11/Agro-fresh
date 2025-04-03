// En product.routes.js
import express from "express";
import {
  deleteProduct,
  getProducts,
  getProductById,
  updateProduct,
  addProduct,
  getProductImage
} from "../controllers/Products.controller.js";
import upload from "../config/multer.config.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas de productos
router.use(authMiddleware);

// Rutas básicas de productos
router.get("/", getProducts);
router.post("/", upload.single('image'), addProduct);
router.delete("/:productId", deleteProduct);
router.get("/:productId", getProductById);
router.put("/:productId", upload.single('image'), updateProduct);

// Ruta para obtener la imagen de un producto específico (opcional)
router.get("/:productId/image", getProductImage);

export default router;