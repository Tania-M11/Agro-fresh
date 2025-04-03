const ORDER_URL = 'http://localhost:3001/api/orders';

const $cartCount = document.getElementById('cart-counter');
const $cartTableBody = document.getElementById('cart-table').querySelector('tbody');
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Update cart counter
const updateCartCount = () => {
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  $cartCount.textContent = totalItems;
};

const getOrders = async () => {
  // Check if user is logged in
  const token = localStorage.getItem('userToken');
  
  if (!token) {
    $cartTableBody.innerHTML = `<tr><td colspan="4">Debes iniciar sesión para ver tu historial de compras</td></tr>`;
    return;
  }
  
  try {
    const response = await fetch(ORDER_URL, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    const orders = await response.json();
    renderOrders(orders);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    $cartTableBody.innerHTML = `<tr><td colspan="4">Error al cargar historial: ${error.message}</td></tr>`;
  }
};

const renderOrders = (orders) => {
  $cartTableBody.innerHTML = '';
  
  if (orders.length === 0) {
    $cartTableBody.innerHTML = `<tr><td colspan="4">No hay compras realizadas</td></tr>`;
    return;
  }
  
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  
  const rowsHTML = orders
    .map(
      (item) => `
        <tr>
          <td>${item._id}</td>
          <td>${new Date(item.createdAt).toLocaleDateString('es-ES', options)}</td>
          <td>${item.items.map((product) => product.name).join(', ')}</td>
          <td>$${item.totalPrice.toFixed(2)}</td>
        </tr>
      `
    )
    .join('');
  
  $cartTableBody.innerHTML = rowsHTML;
};

document.addEventListener('DOMContentLoaded', () => {
  getOrders();
  updateCartCount();
});