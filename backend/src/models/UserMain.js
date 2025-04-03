import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    user: { type: String, required: true },
    identification: { type: Number, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["comprador", "vendedor"], required: true },
    phone: { type: String, required: false }
});


export default mongoose.model("User", UserSchema);

