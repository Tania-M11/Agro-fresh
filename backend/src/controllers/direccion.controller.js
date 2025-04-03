import Address from "../models/direccion.model.js";

async function createAddress(req, res) {
    try {
        // Verificar que req.user exista
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                status: "Error",
                message: "Usuario no autenticado correctamente"
            });
        }
        
        const {
            type,
            street,
            number,
            neighborhood,
            city,
            state,
            postalCode,
            reference,
            recipient,
            extraInfo,
            isDefault
        } = req.body;
        
        // Verificar que todos los campos requeridos estén presentes
        if (!type || !street || !number || !neighborhood || !city || !state || !postalCode || !recipient) {
            return res.status(400).json({
                status: "Error",
                message: "Campos incompletos para la dirección"
            });
        }
        
        // Si se marca como dirección por defecto, desmarcar las otras
        if (isDefault) {
            await Address.updateMany(
                { user: req.user._id },
                { isDefault: false }
            );
        }
        
        const newAddress = new Address({
            user: req.user._id,
            type,
            street,
            number,
            neighborhood,
            city,
            state,
            postalCode,
            reference,
            recipient,
            extraInfo,
            isDefault: isDefault || false
        });
            
        await newAddress.save();
        
        res.status(201).json({
            status: "ok",
            message: "Dirección agregada exitosamente",
            address: newAddress
        });
    } catch (error) {
        console.error("Error al crear dirección:", error);
        res.status(500).json({
            status: "Error",
            message: "Error en el servidor al crear dirección"
        });
    }
}

async function getUserAddresses(req, res) {
    try {
        // Verificar que req.user exista
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                status: "Error",
                message: "Usuario no autenticado correctamente"
            });
        }
        
        const addresses = await Address.find({ user: req.user._id });
            
        res.status(200).json({
            status: "ok",
            addresses: addresses
        });
    } catch (error) {
        console.error("Error al obtener direcciones:", error);
        res.status(500).json({
            status: "Error",
            message: "Error en el servidor al obtener direcciones"
        });
    }
}

async function updateAddress(req, res) {
    try {
        // Verificar que req.user exista
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                status: "Error",
                message: "Usuario no autenticado correctamente"
            });
        }
        
        const { addressId } = req.params;
        const updateData = req.body;
        
        // Si se marca como dirección por defecto, desmarcar las otras
        if (updateData.isDefault) {
            await Address.updateMany(
                { user: req.user._id },
                { isDefault: false }
            );
        }
        
        const updatedAddress = await Address.findOneAndUpdate(
            { _id: addressId, user: req.user._id },
            updateData,
            { new: true, runValidators: true }  // Agregado runValidators para validar los datos al actualizar
        );
        
        if (!updatedAddress) {
            return res.status(404).json({
                status: "Error",
                message: "Dirección no encontrada"
            });
        }
        
        res.status(200).json({
            status: "ok",
            message: "Dirección actualizada exitosamente",
            address: updatedAddress
        });
    } catch (error) {
        console.error("Error al actualizar dirección:", error);
        res.status(500).json({
            status: "Error",
            message: "Error en el servidor al actualizar dirección"
        });
    }
}

async function deleteAddress(req, res) {
    try {
        // Verificar que req.user exista
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                status: "Error",
                message: "Usuario no autenticado correctamente"
            });
        }
        
        const { addressId } = req.params;
        
        const deletedAddress = await Address.findOneAndDelete({
            _id: addressId,
            user: req.user._id
        });
        
        if (!deletedAddress) {
            return res.status(404).json({
                status: "Error",
                message: "Dirección no encontrada"
            });
        }
        
        res.status(200).json({
            status: "ok",
            message: "Dirección eliminada exitosamente"
        });
    } catch (error) {
        console.error("Error al eliminar dirección:", error);
        res.status(500).json({
            status: "Error",
            message: "Error en el servidor al eliminar dirección"
        });
    }
}

const methods = {
    createAddress,
    getUserAddresses,
    updateAddress,
    deleteAddress
};

export default methods;