import bcryptjs from "bcryptjs";
import User from "../models/UserMain.js";

// Obtener el perfil del usuario
async function getProfile(req, res) {
    try {
        const userId = req.userId; // ID del usuario desde el middleware de autenticación
        const usuario = await User.findById(userId);
        
        if (!usuario) {
            return res.status(404).json({
                status: "Error",
                message: "Usuario no encontrado"
            });
        }
        
        res.status(200).json({
            status: "ok",
            user: usuario.user,
            identification: usuario.identification,
            email: usuario.email,
            role: usuario.role,
            phone: usuario.phone || null
        });
    } catch (error) {
        console.error("Error al obtener perfil:", error);
        res.status(500).json({
            status: "Error",
            message: "Error al obtener la información del perfil"
        });
    }
}

// Actualizar el perfil del usuario
async function updateProfile(req, res) {
    try {
        const userId = req.userId;
        const { 
            user,
            email,
            password,
            passwordVerification
        } = req.body;
        
        // Validaciones básicas
        if (!user || !email) {
            return res.status(400).json({
                status: "Error",
                message: "Nombre y correo son obligatorios"
            });
        }
        
        // Buscar usuario
        const usuario = await User.findById(userId);
        if (!usuario) {
            return res.status(404).json({
                status: "Error",
                message: "Usuario no encontrado"
            });
        }
        
        // Verificar si el email ya está en uso por otro usuario
        if (email !== usuario.email) {
            const emailExistente = await User.findOne({ 
                email, 
                _id: { $ne: userId } 
            });
            if (emailExistente) {
                return res.status(400).json({
                    status: "Error",
                    message: "El correo electrónico ya está en uso"
                });
            }
        }
        
        // Actualizar datos básicos
        usuario.user = user;
        usuario.email = email;
        
        // Actualizar contraseña si se proporcionó
        if (password) {
            // Validar que las contraseñas coincidan
            if (password !== passwordVerification) {
                return res.status(400).json({
                    status: "Error",
                    message: "Las contraseñas no coinciden"
                });
            }
            
            // Generar hash de la nueva contraseña
            const salt = await bcryptjs.genSalt(5);
            const hashedPassword = await bcryptjs.hash(password, salt);
            usuario.password = hashedPassword;
        }
        
        // Guardar cambios
        await usuario.save();
        
        res.status(200).json({
            status: "ok",
            message: "Perfil actualizado exitosamente"
        });
    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        res.status(500).json({
            status: "Error",
            message: "Error al actualizar el perfil"
        });
    }
}

const methods = {
    getProfile,
    updateProfile
};

export default methods;