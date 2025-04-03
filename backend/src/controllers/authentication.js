import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/UserMain.js";

// LOGIN
async function login(req, res) {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ status: "Error", message: "Los campos están incompletos" });
    }
    
    const usuarioEncontrado = await User.findOne({ email });
    if (!usuarioEncontrado) {
        return res.status(400).json({ status: "Error", message: "Usuario no encontrado" });
    }
    
    const contraseñaValida = await bcryptjs.compare(password, usuarioEncontrado.password);
    if (!contraseñaValida) {
        return res.status(400).json({ status: "Error", message: "Contraseña incorrecta" });
    }
    
    // Generar token JWT
   // En authentication.js (login function)
const token = jwt.sign(
    { userId: usuarioEncontrado._id, role: usuarioEncontrado.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
);
    res.status(200).json({
        status: "ok",
        message: "Inicio de sesión exitoso",
        token: token,
        role: usuarioEncontrado.role,
        phone: usuarioEncontrado.phone, // Added phone number to the response
        redirect: usuarioEncontrado.role === "vendedor" ? "/admin" : "/app/public/index.html"
    });

}

// REGISTRO
async function register(req, res) {
    const { user, identification, email, password, passwordVerification, role, phone } = req.body;
    
    // Updated to include phone in the required fields
    if (!user || !password || !email || !passwordVerification || !identification || !role || !phone) {
        return res.status(400).json({ status: "Error", message: "Los campos están incompletos" });
    }
    
    if (password !== passwordVerification) {
        return res.status(400).json({ status: "Error", message: "Las contraseñas no coinciden" });
    }
    
    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) {
        return res.status(400).json({ status: "Error", message: "El correo ya está registrado" });
    }
    
    const salt = await bcryptjs.genSalt(5);
    const hashedPassword = await bcryptjs.hash(password, salt);
    
    try {
        const nuevoUsuario = new User({
            user,
            identification,
            email,
            password: hashedPassword,
            role,
            phone // Added phone to the user creation
        });
        
        await nuevoUsuario.save();
        res.status(201).json({ status: "ok", message: `Usuario ${nuevoUsuario.user} agregado`, redirect: "/" });
        
    } catch (error) {
        res.status(500).json({ status: "Error", message: "Error en el servidor" });
    }
}

const methods = { login, register };
export default methods;