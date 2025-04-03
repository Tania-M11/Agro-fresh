import bcryptjs from "bcryptjs";
import User from "../models/UserMain.js";

// Función para validar la fortaleza de la contraseña
function validatePasswordStrength(password) {
    // Requisitos de la contraseña
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
    
    // Validar requisitos
    if (password.length < minLength) {
        return {
            valid: false,
            message: "La contraseña debe tener al menos 8 caracteres"
        };
    }
    
    if (!hasUpperCase) {
        return {
            valid: false,
            message: "La contraseña debe incluir al menos una letra mayúscula"
        };
    }
    
    if (!hasLowerCase) {
        return {
            valid: false,
            message: "La contraseña debe incluir al menos una letra minúscula"
        };
    }
    
    if (!hasNumbers) {
        return {
            valid: false,
            message: "La contraseña debe incluir al menos un número"
        };
    }
    
    if (!hasSpecialChar) {
        return {
            valid: false,
            message: "La contraseña debe incluir al menos un carácter especial"
        };
    }
    
    return {
        valid: true,
        message: "Contraseña válida"
    };
}

// Función para restablecer la contraseña
async function resetPassword(req, res) {
    const { email, identification, newPassword, confirmPassword } = req.body;
    
    // Verificar que todos los campos necesarios estén presentes
    if (!email || !identification || !newPassword || !confirmPassword) {
        return res.status(400).json({ 
            status: "Error", 
            message: "Todos los campos son obligatorios" 
        });
    }
    
    // Verificar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ 
            status: "Error", 
            message: "Las contraseñas no coinciden" 
        });
    }
    
    // Validar la fortaleza de la contraseña
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
        return res.status(400).json({
            status: "Error",
            message: passwordValidation.message
        });
    }
    
    try {
        // Buscar al usuario por email y número de identificación
        const user = await User.findOne({ 
            email: email, 
            identification: identification 
        });
        
        // Si no encontramos al usuario con esa combinación
        if (!user) {
            return res.status(404).json({ 
                status: "Error", 
                message: "Usuario no encontrado o datos incorrectos" 
            });
        }
        
        // Generar el hash de la nueva contraseña
        const salt = await bcryptjs.genSalt(5);
        const hashedPassword = await bcryptjs.hash(newPassword, salt);
        
        // Actualizar la contraseña del usuario
        user.password = hashedPassword;
        await user.save();
        
        // Enviar respuesta exitosa
        return res.status(200).json({ 
            status: "ok", 
            message: "Contraseña actualizada correctamente",
            redirect: "/"
        });
        
    } catch (error) {
        console.error("Error al restablecer contraseña:", error);
        return res.status(500).json({ 
            status: "Error", 
            message: "Error en el servidor" 
        });
    }
}

export default { resetPassword };