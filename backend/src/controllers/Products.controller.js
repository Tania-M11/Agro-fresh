import Product from '../models/Product.model.js'; 
import fs from 'fs'; 
import path from 'path';
import Notification from '../models/notificacion.model.js';


// Consultar u obtener todos los productos que tenemos en la bd
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    if (!products || products.length === 0) {
      return res.status(404).json({ message: 'No hay productos cargados' });
    }
    return res.json(products);
  } catch (error) {
    console.error('Error al obtener los productos', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Agregar productos
export const addProduct = async (req, res) => {
  try {
    // El archivo ya está disponible en req.file gracias a multer
    let imageUrl = null;
    
    if (req.file) {
      // Crear una URL relativa para la imagen
      imageUrl = `/uploads/${req.file.filename}`;
    }
    
    // Manejar los campos de descuento
    const price = parseFloat(req.body.price);
    const discount = parseFloat(req.body.discount) || 0;
    const hasDiscount = discount > 0;
    
    // Si hay descuento, el precio original sería el precio antes del descuento
    let originalPrice = price;
    
    // Si hay descuento, el precio que llega ya es el descontado
    // pero queremos guardar el precio original
    if (hasDiscount && req.body.originalPrice) {
      originalPrice = parseFloat(req.body.originalPrice);
    }
    
    // Validar fecha de vencimiento
    const expirationDate = new Date(req.body.expirationDate);
    const today = new Date();
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 1);
    
    if (expirationDate < today) {
      return res.status(400).json({ message: 'La fecha de vencimiento no puede ser anterior a hoy' });
    }
    
    if (expirationDate > maxDate) {
      return res.status(400).json({ message: 'La fecha de vencimiento no puede ser mayor a 1 mes' });
    }
    
    // Calcular estado de notificación inicial
    let notificationStatus = calculateNotificationStatus(expirationDate);
    
    // Crear un nuevo producto con los datos del body y la imagen
    const newProduct = new Product({
      ...req.body,
      userId: req.user._id,
      image: imageUrl,
      originalPrice,
      discount,
      hasDiscount,
      expirationDate,
      notificationStatus
    });
    
    if (!newProduct) {
      return res.status(404).json({ message: 'Campos incompletos' });
    }

    
     // Crear notificación para el producto recién agregado
     const notification = new Notification({
      userId: req.user._id,
      productId: newProduct._id,
      productName: newProduct.name,
      message: `Has agregado "${newProduct.name}" a tu inventario. Te mantendremos informado sobre su fecha de vencimiento (${new Date(newProduct.expirationDate).toLocaleDateString()}).`,
      status: 'green', // Estado inicial (verde)
      isRead: false
    });
    await notification.save();
    await newProduct.save();
    // En la función addProduct
    return res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error al guardar el producto", error);
    return res.status(500).json({ message: 'Error interno del server' });
  }
};

// Actualizar producto
export const updateProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const updateData = { ...req.body };
    
    // Verificar si hay un producto existente
    const existingProduct = await Product.findById(productId);
    
    if (!existingProduct) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    // Verificar que el usuario sea el propietario del producto
    if (existingProduct.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No tienes permiso para editar este producto' });
    }

    // Manejar los campos de descuento
    if ('price' in updateData) {
      const price = parseFloat(updateData.price);
      const discount = parseFloat(updateData.discount) || 0;
      const hasDiscount = discount > 0;
      
      updateData.discount = discount;
      updateData.hasDiscount = hasDiscount;
      
      // Si hay descuento, el precio original debe ser diferente al precio con descuento
      if (hasDiscount) {
        if ('originalPrice' in updateData) {
          updateData.originalPrice = parseFloat(updateData.originalPrice);
        } else if (existingProduct.originalPrice) {
          updateData.originalPrice = existingProduct.originalPrice;
        } else {
          // Si no hay precio original previo, calculamos uno basado en el precio actual y el descuento
          const originalPrice = price / (1 - discount / 100);
          updateData.originalPrice = originalPrice;
        }
      } else {
        // Si no hay descuento, el precio original debe ser igual al precio
        updateData.originalPrice = price;
      }
    }

    // Si se actualiza la fecha de vencimiento
    if (updateData.expirationDate) {
      const expirationDate = new Date(updateData.expirationDate);
      const today = new Date();
      const maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 1);
      
      if (expirationDate < today) {
        return res.status(400).json({ message: 'La fecha de vencimiento no puede ser anterior a hoy' });
      }
      
      if (expirationDate > maxDate) {
        return res.status(400).json({ message: 'La fecha de vencimiento no puede ser mayor a 1 mes' });
      }
      
      // Recalcular estado de notificación
      updateData.notificationStatus = calculateNotificationStatus(expirationDate);
      
      // Crear notificación de actualización de producto
      try {
        const notification = new Notification({
          userId: req.user._id,
          productId: existingProduct._id,
          productName: existingProduct.name,
          message: `Has actualizado "${existingProduct.name}". La nueva fecha de vencimiento es ${expirationDate.toLocaleDateString()}.`,
          status: updateData.notificationStatus,
          isRead: false
        });
        await notification.save();
      } catch (notifError) {
        console.error('Error al crear notificación de actualización:', notifError);
        // No detenemos el proceso si falla la notificación
      }
    }
    
    // Si hay un nuevo archivo de imagen
    if (req.file) {
      // Crear URL para la nueva imagen
      updateData.image = `/uploads/${req.file.filename}`;
      
      // Eliminar imagen anterior si existe
      if (existingProduct.image) {
        const oldImagePath = path.join(process.cwd(), existingProduct.image.replace(/^\//, ''));
        
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    );
    
    return res.json(updatedProduct);
  } catch (error) {
    console.error("Error al actualizar el producto", error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Función para calcular el estado de notificación según la fecha de vencimiento
function calculateNotificationStatus(expirationDate) {
  const now = new Date();
  const daysToExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
  
  if (daysToExpiration <= 0) {
    return 'expired';
  } else if (daysToExpiration <= 3) {
    return 'red';
  } else if (daysToExpiration <= 7) {
    return 'yellow';
  } else {
    return 'green';
  }
}

// Resto de los métodos (deleteProduct, getProductById, getProductImage) continúan igual...
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    
    if (!product) {
      return res.status(404).json({ message: 'El producto no existe' });
    }
    
    // Si el producto tiene una imagen, eliminarla del servidor
    if (product.image) {
      const imagePath = path.join(process.cwd(), product.image.replace(/^\//, ''));
      
      // Verificar si el archivo existe antes de intentar eliminarlo
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    const deletedProduct = await Product.findByIdAndDelete(req.params.productId);
    
    return res.status(200).json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error("Error al eliminar el producto", error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    return res.json(product);
  } catch (error) {
    console.error("Error al obtener el producto", error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    
    if (!product || !product.image) {
      return res.status(404).json({ message: 'Imagen no encontrada' });
    }

    const imagePath = path.join(process.cwd(), product.image.replace(/^\//, ''));
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ message: 'Archivo de imagen no encontrado' });
    }
    
    return res.sendFile(imagePath);
  } catch (error) {
    console.error("Error al obtener la imagen", error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};