import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./src/config/bd.js";

// Importar rutas
import ProductRoutes from "./src/routes/Product.routes.js";
import OrderRoutes from "./src/routes/Order.routes.js";
import ProfileRoutes from "./src/routes/profile.routes.js"; 
import AddressRoutes from "./src/routes/direccion.routes.js"; 
import authentication from "./src/controllers/authentication.js";
import paymentRoutes from "./src/routes/payment.routes.js";
import authRoutes from "./src/routes/auth.routes.js";  // Corregido nombre de archivo
import notificationRoutes from "./src/routes/notificacion.routes.js";
import setupCronJobs from "./src/schedulers/cron.js";

// Configurar dotenv
dotenv.config();

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 5000;

// Conectar a la base de datos
connectDB();

// Configurar rutas estáticas
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "..", "frontend")));

// Middlewares
app.use(express.json());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));

// Configuración de CORS
const origenesPermitidos = [
  "http://127.0.0.1:3001",
  "http://127.0.0.1:5501",
  "https://agro-fresh-3.onrender.com"
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || origenesPermitidos.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Cliente no permitido"));
    }
  },
  credentials: true, // Permite cookies y autenticación
};

app.use(cors(corsOptions));

// Rutas para servir archivos HTML
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "..", "frontend", "register.html")));
app.get("/register", (req, res) => res.sendFile(path.join(__dirname, "..", "frontend", "pages", "register.html")));
app.get("/forgot-password", (req, res) => res.sendFile(path.join(__dirname, "..", "frontend", "pages", "forgot-password.html")));

// Rutas de la API
app.use("/api/products", ProductRoutes);
app.use("/api/orders", OrderRoutes);
app.use("/api", ProfileRoutes);
app.use("/api", AddressRoutes);
app.post("/api/register", authentication.register);
app.post("/api/login", authentication.login);
app.use("/api", paymentRoutes);
app.use("/api", authRoutes);
app.use("/api/notifications", notificationRoutes);

// Iniciar cron jobs
setupCronJobs();

// Configurar express para servir archivos estáticos desde 'uploads'
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Iniciar servidor
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
