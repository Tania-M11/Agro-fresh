export const cartFunction = () => {
  const addToCartButtons = document.querySelectorAll('.add-to-cart');
  const cartCounter = document.getElementById('cart-counter');
  
  // Función para obtener un carrito específico del usuario
  const getUserCart = () => {
    const token = localStorage.getItem('token');
    if (!token) return [];
    
    // Decodificar el token para obtener el userId (sin verificar firma)
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return [];
      
      const payload = JSON.parse(atob(tokenParts[1]));
      const userId = payload.userId;
      
      // Obtener el carrito específico para este usuario
      return JSON.parse(localStorage.getItem(`cart_${userId}`)) || [];
    } catch (error) {
      console.error('Error al decodificar token:', error);
      return [];
    }
  };
  
  // Función para guardar el carrito específico del usuario
  const saveUserCart = (cart) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return;
      
      const payload = JSON.parse(atob(tokenParts[1]));
      const userId = payload.userId;
      
      localStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
    } catch (error) {
      console.error('Error al guardar carrito de usuario:', error);
    }
  };
  
  // Obtener carrito actual del usuario
  let cart = getUserCart();
  
  // Actualizar contador de carrito
  const updateCartCount = () => {
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    cartCounter.textContent = totalItems;
  };
  
  // Inicializar contador
  updateCartCount();
  
  addToCartButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      // Obtener ID del producto del botón
      const productId = e.target.id;
      
      try {
        // Obtener token desde localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          alert('No has iniciado sesión. Por favor, inicia sesión para agregar productos al carrito.');
          return;
        }
        
        // Obtener información detallada del producto desde la API con autenticación
        const response = await fetch(`http://localhost:3001/api/products/${productId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error al obtener datos del producto: ${response.status}`);
        }
        
        const product = await response.json();
        
        // Verificar que el producto tenga un precio válido
        if (typeof product.price !== 'number' || isNaN(product.price)) {
          console.error('El producto no tiene un precio válido:', product);
          throw new Error('El producto no tiene un precio válido');
        }
        
        // Verificar si el producto ya está en el carrito
        const existingItemIndex = cart.findIndex(item => item.productId === productId);
        
        if (existingItemIndex !== -1) {
          // Si existe, incrementar cantidad
          cart[existingItemIndex].quantity += 1;
          
          // Asegurar que el precio esté actualizado (en caso de que haya cambiado)
          cart[existingItemIndex].price = product.price;
          
          // Actualizar información de descuento
          if (product.hasDiscount) {
            cart[existingItemIndex].hasDiscount = true;
            cart[existingItemIndex].originalPrice = product.originalPrice;
          }
          
          // Actualizar imagen si existe y no se guardó antes
          if (product.image && !cart[existingItemIndex].image) {
            cart[existingItemIndex].image = product.image;
          }
        } else {
          // Crear un nuevo objeto para el carrito con datos completos del producto
          const newCartItem = {
            productId: productId,
            name: product.name,
            price: product.price,
            quantity: 1
          };
          
          // Añadir información de descuento si existe
          if (product.hasDiscount) {
            newCartItem.hasDiscount = true;
            newCartItem.originalPrice = product.originalPrice;
          }
          
          // Añadir imagen del producto si existe
          if (product.image) {
            newCartItem.image = product.image;
          }
          
          // Añadir nuevo producto al carrito
          cart.push(newCartItem);
        }
        
        // Imprimir para debug
        console.log('Producto agregado al carrito:', {
          nombre: product.name,
          precio: product.price,
          precioOriginal: product.originalPrice,
          descuento: product.hasDiscount,
          imagen: product.image || 'No disponible'
        });
        
        // Guardar carrito actualizado en localStorage
        saveUserCart(cart);
        
        // Actualizar contador
        updateCartCount();
        
        // Mostrar mensaje de confirmación
        alert(`${product.name} se ha agregado al carrito`);
      } catch (error) {
        console.error('Error al agregar el producto al carrito:', error);
        alert('No se pudo agregar el producto al carrito. Por favor, intenta nuevamente.');
      }
    });
  });
};