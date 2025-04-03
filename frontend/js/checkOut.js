// Función para decodificar el token y obtener el userId
function getUserIdFromToken(token) {
  if (!token) return null;
  
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) return null;
    
    const payload = JSON.parse(atob(tokenParts[1]));
    return payload.userId;
  } catch (error) {
    console.error('Error al decodificar token:', error);
    return null;
  }
}
const $cartCount = document.getElementById("cart-counter"); 
const $cartTableBody = document
  .getElementById("cart-table")
  .querySelector("tbody"); 
const $checkoutButton = document.getElementById("checkout");  

// Obtener el token
// Obtener el token
const token = localStorage.getItem("token");
const userId = getUserIdFromToken(token);

// Obtener el carrito específico del usuario actual
let cart = userId ? JSON.parse(localStorage.getItem(`cart_${userId}`)) || [] : [];

// Agregar la URL base para las imágenes
const BASE_URL = 'http://localhost:3001';

// Validar y reparar el carrito si hay precios inválidos 
const validateCart = async () => {   
  let needsUpdate = false;      
  
  // Crear un array de promesas para actualizar los productos con precios inválidos o faltantes
  const updatePromises = cart.map(async (item, index) => {     
    // Si el precio no es válido o no tiene imagen, intentamos obtener los datos desde la API
    if (typeof item.price !== "number" || item.price === 0 || isNaN(item.price) || !item.image) {       
      try {         
        const response = await fetch(`${BASE_URL}/api/products/${item.productId}`, {
          headers: {
              'Authorization': `Bearer ${token}`
          }
      });                 
        
        if (!response.ok) {           
          console.error(`Error al obtener datos actualizados para ${item.name}`);           
          return;         
        }                  
        
        const product = await response.json();                  
        
        // Actualizar el precio y otros datos del producto         
        cart[index].price = product.price;                  
        
        if (product.hasDiscount) {           
          cart[index].hasDiscount = true;           
          cart[index].originalPrice = product.originalPrice;         
        }
        
        // Agregamos la imagen del producto si existe
        if (product.image) {
          cart[index].image = product.image;
        }
                  
        console.log(`Producto actualizado para ${item.name}: ${product.price}, imagen: ${product.image || 'No disponible'}`);         
        needsUpdate = true;       
      } catch (error) {         
        console.error(`Error al actualizar el producto ${item.name}:`, error);       
      }     
    }   
  });      
  
  // Esperar a que todas las actualizaciones terminen   
  await Promise.all(updatePromises);      
  
  // Si hubo actualizaciones, guardar el carrito actualizado   
  if (needsUpdate && userId) {
    localStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
}
};  

// Actualiza el contador del carrito en la interfaz 
const updateCartCount = () => {   
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);   
  $cartCount.textContent = totalItems; 
};  

// Renderiza los productos del carrito en la tabla 
const renderCart = () => {   
  $cartTableBody.innerHTML = "";      
  
  if (cart.length === 0) {     
    $cartTableBody.innerHTML = `<tr><td colspan="6" class="empty-cart">El carrito está vacío</td></tr>`;     
    $checkoutButton.disabled = true;     
    return;   
  }      
  
  $checkoutButton.disabled = false;      
  
  // Diagnosticar problemas con los precios   
  cart.forEach(item => {     
    if (typeof item.price !== "number" || item.price === 0 || isNaN(item.price)) {       
      console.error("Producto sin precio válido:", item);     
    }   
  });      
  
  const rowsHTML = cart
    .map((item) => {       
      // Asegurar que el precio sea un número válido       
      const price = typeof item.price === "number" && !isNaN(item.price) ? item.price : 0;              
      
      let priceHTML;              
      
      // Verificar si el producto tiene descuento       
      if (item.hasDiscount && typeof item.originalPrice === "number" && !isNaN(item.originalPrice)) {         
        priceHTML = `           
          <span class="original-price">$${item.originalPrice.toFixed(2)}</span>           
          <span class="discounted-price">$${price.toFixed(2)}</span>         
        `;       
      } else {         
        priceHTML = `$${price.toFixed(2)}`;       
      }              
      
      // Determinar la URL de la imagen
      let imageUrl;
      if (item.image) {
        // Usar la imagen almacenada en el modelo
        imageUrl = `${BASE_URL}${item.image}`;
      } else {
        // Imagen por defecto si no hay imagen
        imageUrl = 'img/default-product.png';
      }
      
      // Calcular el total para este ítem       
      const total = (price * item.quantity).toFixed(2);              
      
      return `<tr>
          <td class="product-image-cell">
            <div class="cart-product-image">
              <img src="${imageUrl}" alt="${item.name}" onerror="this.src='img/default-product.png'">
            </div>
          </td>
          <td>${item.name}</td>           
          <td>${priceHTML}</td>           
          <td>             
            <button class="decrease-quantity" data-id="${item.productId}">-</button>             
            ${item.quantity}             
            <button class="increase-quantity" data-id="${item.productId}">+</button>           
          </td>           
          <td>$${total}</td>           
          <td><img class="delete" data-id="${item.productId}" src="./img/trash.svg"/></td>         
        </tr>       
      `;     
    })     
    .join("");      
  
  $cartTableBody.innerHTML = rowsHTML;      
  
  // Agregamos una fila para el total   
  const totalAmount = cart.reduce((sum, item) => {     
    const itemPrice = typeof item.price === "number" && !isNaN(item.price) ? item.price : 0;     
    return sum + (itemPrice * item.quantity);   
  }, 0).toFixed(2);      
  
  const totalRow = `     
    <tr class="cart-total">       
      <td colspan="4" class="text-right"><strong>Total:</strong></td>       
      <td>$${totalAmount}</td>       
      <td></td>     
    </tr>   
  `;      
  
  $cartTableBody.innerHTML += totalRow;      
  
  attachCartEvents(); 
};  

// Aumentar la cantidad de un producto 
const increaseQuantity = (productId) => {   
  const index = cart.findIndex(item => item.productId === productId);   
  if (index !== -1) {     
    cart[index].quantity += 1;     
    localStorage.setItem("cart", JSON.stringify(cart));     
    renderCart();     
    updateCartCount();   
  } 
};  

// Disminuir la cantidad de un producto 
const decreaseQuantity = (productId) => {   
  const index = cart.findIndex(item => item.productId === productId);   
  if (index !== -1) {     
    if (cart[index].quantity > 1) {       
      cart[index].quantity -= 1;     
    } else {       
      // Si la cantidad llega a 0, eliminar el producto       
      deleteCartItem(productId);       
      return;     
    }     
    localStorage.setItem("cart", JSON.stringify(cart));     
    renderCart();     
    updateCartCount();   
  } 
};  

// Redirigir a la página de pago 
const goToCheckout = (e) => {   
  e.preventDefault();      
  
  if (cart.length === 0) {     
    alert("El carrito está vacío");     
    return;   
  }      
  
  // Verificar si el usuario está autenticado   
  const token = localStorage.getItem("userToken");      
  
  if (!token) {     
    alert("Debes iniciar sesión para realizar una compra");     
    window.location.href = "register.html";     
    return;   
  }      
  
  // Guardar el carrito actualizado en localStorage   
  localStorage.setItem("cart", JSON.stringify(cart));      
  
  // Redirigir a la página de pago   
  window.location.href = "./pago.html"; 
};  

// Eliminar un ítem del carrito 
const deleteCartItem = (productId) => {   
  cart = cart.filter((item) => item.productId !== productId);   
  localStorage.setItem("cart", JSON.stringify(cart));   
  renderCart();   
  updateCartCount(); 
};  

// Agregar eventos a los botones 
const attachCartEvents = () => {   
  // Botones para eliminar productos   
  const deleteButtons = document.querySelectorAll(".delete");   
  deleteButtons.forEach((button) => {     
    button.addEventListener("click", (e) => {       
      const productId = e.target.getAttribute("data-id");       
      deleteCartItem(productId);     
    });   
  });      
  
  // Botones para aumentar cantidad   
  const increaseButtons = document.querySelectorAll(".increase-quantity");   
  increaseButtons.forEach((button) => {     
    button.addEventListener("click", (e) => {       
      const productId = e.target.getAttribute("data-id");       
      increaseQuantity(productId);     
    });   
  });      
  
  // Botones para disminuir cantidad   
  const decreaseButtons = document.querySelectorAll(".decrease-quantity");   
  decreaseButtons.forEach((button) => {     
    button.addEventListener("click", (e) => {       
      const productId = e.target.getAttribute("data-id");       
      decreaseQuantity(productId);     
    });   
  }); 
};  

// Añadir estilos para el carrito 
const addCartStyles = () => {   
  if (!document.getElementById("cart-styles")) {     
    const styleElement = document.createElement("style");     
    styleElement.id = "cart-styles";     
    styleElement.textContent = `       
      .original-price {         
        text-decoration: line-through;         
        color: #888;         
        margin-right: 8px;         
        font-size: 0.9em;       
      }              
      
      .discounted-price {         
        color: #e63946;         
        font-weight: bold;       
      }              
      
      .cart-total {         
        font-weight: bold;         
        background-color: #f8f9fa;       
      }              
      
      .text-right {         
        text-align: right;       
      }              
      
      .empty-cart {         
        text-align: center;         
        padding: 20px;       
      }              
      
      .increase-quantity, .decrease-quantity {         
        padding: 2px 8px;         
        margin: 0 5px;         
        background-color: #f0f0f0;         
        border: 1px solid #ddd;         
        border-radius: 3px;         
        cursor: pointer;       
      }              
      
      .increase-quantity:hover, .decrease-quantity:hover {         
        background-color: #e0e0e0;       
      }
      
      .cart-product-image {
        width: 50px;
        height: 50px;
        overflow: hidden;
        border-radius: 5px;
        margin: 0 auto;
      }
      
      .cart-product-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .product-image-cell {
        width: 60px;
        padding: 5px;
      }
    `;     
    document.head.appendChild(styleElement);   
  } 
};    

// Inicializar cuando la página esté cargada 
document.addEventListener("DOMContentLoaded", async () => {   
  addCartStyles();      
  
  // Validar y corregir precios en el carrito   
  await validateCart();      
  
  renderCart();   
  updateCartCount();      
  
  // Añadir el evento al botón de finalizar compra   
  $checkoutButton.addEventListener("click", goToCheckout);      
  
  // Debug del carrito   
  console.log("Carrito inicial:", cart); 
});