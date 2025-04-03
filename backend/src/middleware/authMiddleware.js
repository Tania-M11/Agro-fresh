import jwt from "jsonwebtoken";
import User from "../models/UserMain.js"; // Asegúrate de que la ruta sea correcta

export const authMiddleware = async (req, res, next) => {
    try {
        // Obtener el token del encabezado de autorización
        console.log('Headers recibidos:', req.headers);
        const authHeader = req.headers.authorization;
        console.log('Auth header:', authHeader);
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log('Error: No se encontró el token o formato incorrecto');
            return res.status(401).json({
                status: "Error",
                message: "No autorizado - Token no proporcionado"
            });
        }
        
        // Extraer el token
        const token = authHeader.split(" ")[1];
        console.log('Token extraído:', token ? 'presente' : 'ausente');
        
        // Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Buscar al usuario en la base de datos
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                status: "Error",
                message: "No autorizado - Usuario no encontrado"
            });
        }
        
        // Agregar el usuario y su rol a la solicitud
        req.user = user;
        req.userId = decoded.userId;
        req.userRole = decoded.role || user.role; // Asegurar que el rol se extraiga correctamente
        
        next();
    } catch (error) {
        console.error("Error en middleware de autenticación:", error);
        return res.status(401).json({
            status: "Error",
            message: "No autorizado - Token inválido o expirado"
        });
    }
};

export default authMiddleware;
