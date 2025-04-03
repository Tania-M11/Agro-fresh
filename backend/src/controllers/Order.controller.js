import Order from '../models/Orders.models.js';

// Get orders filtered by user ID
export const getOrders = async (req, res) => {
  try {
    const userId = req.userId; // Get user ID from auth middleware
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    
    const orders = await Order.find({ userId });
    
    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No hay órdenes para este usuario' });
    }
    
    return res.json(orders);
  } catch (error) {
    console.error('Error al obtener las órdenes:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Add order with user ID
export const addOrder = async (req, res) => {
  const { items, shippingCost = 0, paymentMethod = 'cash' } = req.body;
  const userId = req.userId; // Get user ID from auth middleware
  
  if (!userId) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }
  
  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'El carrito de compras está vacío' });
  }
  
  try {
    // Calcular el subtotal (suma de todos los ítems)
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // Agregar el costo de envío al precio total
    const totalPrice = subtotal + shippingCost;
    
    const newOrder = new Order({
      userId, // Add the user ID to the order
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      shippingCost,
      totalPrice,
      paymentMethod,
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'completed'
    });
    
    await newOrder.save();
    return res.status(201).json({ message: 'ok', newOrder });
  } catch (error) {
    console.error('Error al crear la orden:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};