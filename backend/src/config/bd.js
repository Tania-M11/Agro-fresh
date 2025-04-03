import mongoose from "mongoose";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/agrofresh";
    if (!uri) {
      throw new Error("❌ Falta definir MONGO_URI o MONGO_URL en el archivo .env");
    }

    await mongoose.connect(uri, {
      dbName: "agrofresh", // 💡 Esto asegura que todo se guarde en 'agrofresh'
    });

    console.log("✅ MongoDB conectada correctamente a la base de datos 'agrofresh'");
  } catch (error) {
    console.error("❌ Error al conectar a la base de datos:", error.message);
    process.exit(1);
  }
};


export default connectDB;
