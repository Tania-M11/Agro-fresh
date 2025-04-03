import { Schema, model } from "mongoose";

const productSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number }, // Precio original antes del descuento
  discount: { type: Number, default: 0 }, // Porcentaje de descuento
  hasDiscount: { type: Boolean, default: false }, // Indicador de si tiene descuento activo
  description: String,
  category: { type: String, default: 'Sin categoría' },
  stock: { type: Number, default: 0 },
  unit: { type: String, default: 'unidad' },
  image: { type: String },
  expirationDate: { type: Date, required: true }, // Nueva propiedad para fecha de vencimiento
 // models/Product.model.js - Añadir este campo a tu modelo existente
notificationStatus: {
  type: String,
  enum: ['green', 'yellow', 'red', 'expired'],
  default: 'green'
},
  createdAt: { type: Date, default: Date.now }
});

export default model("Product", productSchema);