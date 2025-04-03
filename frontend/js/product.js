import { cartFunction } from './cart.js';

const API_URL = 'http://localhost:3001/api/products';
const BASE_URL = 'http://localhost:3001'; // Base URL for images

const data = async () => {
  const $container = document.getElementById('product-conntainer');
  
  // Add styles for discounted prices
  const addDiscountStyles = () => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .original-price {
        text-decoration: line-through;
        color: #888;
        margin-right: 8px;
      }
      
      .discounted-price {
        color: #e63946;
        font-weight: bold;
      }
    `;
    document.head.appendChild(styleElement);
  };
  
  addDiscountStyles();
  
  // Get parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const productName = urlParams.get('product');
  const category = urlParams.get('category');
  
  try {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      $container.innerHTML = '<div class="error"><p>No has iniciado sesión. Por favor, inicia sesión para ver los productos.</p></div>';
      return;
    }
    
    // Include the token in the request header
    const response = await fetch(API_URL, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }
    
    const allProducts = await response.json();
    
    let products;
    let filterTitle = '';

    // Apply filters based on parameters
    if (productName === 'productoDelDia') {
      // Filter products with discount when "productoDelDia" is selected
      products = allProducts.filter(product => product.hasDiscount === true);
      filterTitle = 'Productos del Día con Descuento';
    } else if (productName) {
      // Filter by product name
      products = allProducts.filter(product => 
        product.name.toLowerCase() === productName.toLowerCase()
      );
      filterTitle = `Productos: ${productName.charAt(0).toUpperCase() + productName.slice(1)}`;
    } else if (category) {
      // Filter by category
      products = allProducts.filter(product => 
        product.category.toLowerCase() === category.toLowerCase()
      );
      filterTitle = `Categoría: ${category.charAt(0).toUpperCase() + category.slice(1)}`;
    } else {
      // No filter, show all products
      products = allProducts;
    }

    // Show filter title if filtering
    if (filterTitle) {
      const titleElement = document.createElement('h1');
      titleElement.className = 'filter-title';
      titleElement.textContent = filterTitle;
      $container.appendChild(titleElement);
    }

    let productHTML = '';
    
    if (products.length === 0) {
      productHTML = '<div class="no-products"><p>No hay productos disponibles con estos criterios</p></div>';
    } else {
      products.forEach((product) => {
        let priceDisplay;
        
        // Check if the product has a discount
        if (product.hasDiscount) {
          // Format both original and discounted prices
          priceDisplay = `
            <p class="product-price">
              <span class="original-price">$${product.originalPrice.toFixed(2)}</span>
              <span class="discounted-price">$${product.price.toFixed(2)}</span>
            </p>`;
        } else {
          // Just show the regular price
          priceDisplay = `<p class="product-price">$${product.price.toFixed(2)}</p>`;
        }
        
        // Determine image URL
        let imageUrl;
        if (product.image) {
          // Use image stored in the model
          imageUrl = `${BASE_URL}${product.image}`;
        } else {
          // Default image if no image
          imageUrl = 'img/default-product.png';
        }

        productHTML += `<div class="product-card">
          <img src="${imageUrl}" alt="${product.name}" onerror="this.src='img/default-product.png'">
          <h2 class="product-name">${product.name}</h2>
          ${priceDisplay}
          <p class="product-description">${product.description}</p>
          <div class="container-cart">
            <button id="${product._id}" class="add-to-cart">Agregar al carrito</button>
          </div>
        </div>`;
      });
    }
    
    // If we added a title, append products after the title
    if (filterTitle) {
      const productsContainer = document.createElement('div');
      productsContainer.className = 'products-grid';
      productsContainer.innerHTML = productHTML;
      $container.appendChild(productsContainer);
    } else {
      $container.innerHTML = productHTML;
    }
    
    cartFunction();
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    $container.innerHTML = '<div class="error"><p>Error al cargar los productos: ' + error.message + '</p></div>';
  }
};

data();