// scripts/checkProductExpiration.js
import mongoose from 'mongoose';
import Product from '../models/Product.model.js';
import Notification from '../models/notificacion.model.js';
import config from '../config/bd.js';
import dotenv from 'dotenv';

dotenv.config();

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

// Función para generar mensaje según el estado
function generateNotificationMessage(status, productName, daysToExpiration) {
  switch (status) {
    case 'expired':
      return `Tu producto "${productName}" ha caducado. Deberías retirarlo de la venta.`;
    case 'red':
      return `Tu producto "${productName}" caducará en ${daysToExpiration} día(s). ¡Acción urgente requerida!`;
    case 'yellow':
      return `Tu producto "${productName}" caducará en ${daysToExpiration} días. Considera actualizar el inventario pronto.`;
    default:
      return `Tu producto "${productName}" vence en ${daysToExpiration} días.`;
  }
}

async function checkExpirations() {
  let connection = null;
  
  try {
    console.log('Iniciando verificación de fechas de vencimiento...');
    
    // Conectar a la base de datos
    const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/agrofresh";
    connection = await mongoose.connect(mongoURI);
    
    // Obtener todos los productos activos que no han expirado
    const products = await Product.find({
      active: true,
      expirationDate: { $gte: new Date() }
    }).populate('userId');
    
    const today = new Date();
    let notificationsCreated = 0;
    
    for (const product of products) {
      const previousStatus = product.notificationStatus || 'green';
      const newStatus = calculateNotificationStatus(product.expirationDate);
      
      // Calcular días hasta vencimiento
      const daysToExpiration = Math.ceil((product.expirationDate - today) / (1000 * 60 * 60 * 24));
      
      // Si el status ha cambiado o si es rojo/expirado y no se ha enviado notificación hoy
      const shouldNotify = previousStatus !== newStatus || 
                          (newStatus === 'red' && daysToExpiration <= 3) || 
                          (newStatus === 'expired');
      
      if (shouldNotify) {
        // Actualizar estado del producto
        product.notificationStatus = newStatus;
        await product.save();
        
        // Verificar si ya existe una notificación similar hoy
        const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);

const endOfDay = new Date();
endOfDay.setHours(23, 59, 59, 999);

const existingNotification = await Notification.findOne({
  userId: product.userId._id,
  productId: product._id,
  status: newStatus,
  createdAt: {
    $gte: startOfDay,
    $lt: endOfDay
  }
});
        
        // Crear notificación solo si no existe una similar hoy
        if (!existingNotification) {
          const notification = new Notification({
            userId: product.userId._id,
            productId: product._id,
            productName: product.name,
            message: generateNotificationMessage(newStatus, product.name, daysToExpiration),
            status: newStatus,
            isRead: false
          });
          
          await notification.save();
          notificationsCreated++;
        }
      }
    }
    
    console.log(`Verificación completada. ${notificationsCreated} notificaciones creadas.`);
    
  } catch (error) {
    console.error('Error al verificar fechas de vencimiento:', error);
  } finally {
    // Asegurar que la conexión se cierre
    if (connection) {
      await mongoose.connection.close();
      console.log('Conexión a la base de datos cerrada');
    }
  }
}

// Ejecutar la función si este script se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  checkExpirations()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}


export default checkExpirations;