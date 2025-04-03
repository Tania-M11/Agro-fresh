// notification.controller.js
import Notification from '../models/notificacion.model.js';
import Product from '../models/Product.model.js';

// Obtener notificaciones del usuario
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id; // Asumiendo que tienes autenticación implementada
    
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 }); // Ordenadas de más reciente a más antigua
    
    return res.json(notifications);
  } catch (error) {
    console.error('Error al obtener notificaciones', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Marcar notificación como leída
export const markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }
    
    return res.json(notification);
  } catch (error) {
    console.error('Error al actualizar notificación', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Marcar todas las notificaciones como leídas
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id; // Asumiendo que tienes autenticación implementada
    
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
    
    return res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error al actualizar notificaciones', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Eliminar notificación
export const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    
    const notification = await Notification.findByIdAndDelete(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }
    
    return res.json({ message: 'Notificación eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar notificación', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};
// Crear notificación cuando se agrega un producto
export const createProductNotification = async (userId, product) => {
  try {
    const notification = new Notification({
      userId,
      productId: product._id,
      productName: product.name,
      message: `Se ha agregado el producto "${product.name}" exitosamente.`,
      status: 'green', // Puedes ajustar el estado según tus necesidades
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error al crear notificación', error);
    throw new Error('Error al crear notificación');
  }
};
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const count = await Notification.countDocuments({ 
      userId, 
      isRead: false 
    });
    
    return res.json({ count });
  } catch (error) {
    console.error('Error al obtener conteo de notificaciones', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};