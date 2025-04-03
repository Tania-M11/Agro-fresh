const API_URL = "http://localhost:3001/api/products";

document.addEventListener("DOMContentLoaded", () => {
  const $productTableBody = document.getElementById("product-table-body");
  const $editProductModal = document.getElementById("edit-product-modal");
  const $editProductForm = document.getElementById("edit-product-form");
  const $closeModalButton = document.querySelector(".close-modal");

  // Agregar referencia al campo de descuento y al campo de precio
  const $editPrice = document.getElementById("edit-price");
  const $addDiscount = document.getElementById("add-discount");

  // Variable para guardar el precio original
  let originalPrice = 0;

  // Fetch and render seller's products
  const fetchSellerProducts = async () => {
    try {
      // Usar un nombre consistente para el token
      const token = localStorage.getItem("token");

      if (!token) {
        $productTableBody.innerHTML = `
          <tr>
            <td colspan="6">Debes iniciar sesión para ver tus productos</td>
          </tr>
        `;
        return;
      }

      // Decodificar el token para obtener el userId del vendedor actual
      const tokenParts = token.split('.');
      let currentUserId = null;
      
      if (tokenParts.length === 3) {
        try {
          const payload = JSON.parse(atob(tokenParts[1]));
          currentUserId = payload.userId;
        } catch (error) {
          console.error("Error al decodificar token:", error);
        }
      }
      
      if (!currentUserId) {
        throw new Error("No se pudo identificar el usuario actual");
      }
      
      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("No se pudieron cargar los productos");
      }

      const allProducts = await response.json();
      
      // Filtrar solo los productos del vendedor actual
      const products = allProducts.filter(product => product.userId === currentUserId);
      
      if (products.length === 0) {
        $productTableBody.innerHTML = `
          <tr>
            <td colspan="6">No tienes productos registrados</td>
          </tr>
        `;
        return;}

      // Render products in table - Modificado para mostrar si tiene descuento
      $productTableBody.innerHTML = products
        .map(
          (product) => `
            <tr>
              <td>${product.name}</td>
              <td>${product.category}</td>
              <td>
                ${
                  product.hasDiscount
                    ? `<span class="original-price">${product.originalPrice.toFixed(
                        2
                      )}</span> 
                      <span class="discounted-price">${product.price.toFixed(
                        2
                      )}</span>`
                    : `${product.price.toFixed(2)}`
                }
              </td>
              <td>${product.stock} ${product.unit}</td>
              <td>
                <button class="edit-product" data-id="${
                  product._id
                }">Editar</button>
                <button class="delete-product" data-id="${
                  product._id
                }">Eliminar</button>
              </td>
            </tr>
          `
        )
        .join("");

      attachProductActions();
    } catch (error) {
      console.error("Error al cargar productos:", error);
      $productTableBody.innerHTML = `
        <tr>
          <td colspan="6">Error al cargar productos: ${error.message}</td>
        </tr>
      `;
    }
  };

  // Attach event listeners for edit and delete buttons
  const attachProductActions = () => {
    // Edit product button handler
    document.querySelectorAll(".edit-product").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const productId = e.target.getAttribute("data-id");
        await openEditModal(productId);
      });
    });

    // Delete product button handler
    document.querySelectorAll(".delete-product").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const productId = e.target.getAttribute("data-id");
        await deleteProduct(productId);
      });
    });
  };

  // Open edit modal with product details
  const openEditModal = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      
      // Decodificar el token para obtener el userId del vendedor actual
      const tokenParts = token.split('.');
      let currentUserId = null;
      
      if (tokenParts.length === 3) {
        try {
          const payload = JSON.parse(atob(tokenParts[1]));
          currentUserId = payload.userId;
        } catch (error) {
          console.error("Error al decodificar token:", error);
        }
      }
      
      const response = await fetch(`${API_URL}/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      
      if (!response.ok) {
        throw new Error("No se pudo obtener la información del producto");
      }
      
      const product = await response.json();
      
      // Verificar que el producto pertenezca al vendedor actual
      if (product.userId !== currentUserId) {
        throw new Error("No tienes permisos para editar este producto");
      }
      
      // Guardar precio original para cálculos de descuento
      originalPrice = product.hasDiscount
        ? product.originalPrice
        : product.price;

      // Populate edit form
      document.getElementById("edit-name").value = product.name;
      document.getElementById("edit-price").value = product.price;
      document.getElementById("edit-category").value = product.category;
      document.getElementById("edit-stock").value = product.stock;
      document.getElementById("edit-unit").value = product.unit;
      document.getElementById("edit-description").value = product.description || '';

      // Asignar valor al campo de descuento si existe
      document.getElementById("add-discount").value = product.hasDiscount
        ? product.discount
        : "";

      // Store product ID for update
      $editProductForm.setAttribute("data-id", productId);

      // Show modal
      $editProductModal.style.display = "block";
    } catch (error) {
      console.error("Error al cargar detalles del producto:", error);
      alert("No se pudieron cargar los detalles del producto: " + error.message);
    }
  };

  // Función para calcular precio con descuento
  const calculateDiscountedPrice = (price, discountPercentage) => {
    if (
      !discountPercentage ||
      discountPercentage <= 0 ||
      isNaN(discountPercentage)
    ) {
      return price;
    }

    const discount = (price * discountPercentage) / 100;
    return price - discount;
  };

  // Agregar evento para calcular y mostrar el precio con descuento en tiempo real
  $addDiscount.addEventListener("input", () => {
    const discountPercentage = parseFloat($addDiscount.value);
    if (!isNaN(discountPercentage) && discountPercentage > 0) {
      const discountedPrice = calculateDiscountedPrice(
        originalPrice,
        discountPercentage
      );
      $editPrice.value = discountedPrice.toFixed(2);
    } else {
      $editPrice.value = originalPrice.toFixed(2);
    }
  });

  // Update product
  $editProductForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Validación
    let isValid = true;
    let errorMessages = [];

    // Validar nombre (solo letras)
    const name = document.getElementById("edit-name").value.trim();
    if (!/^[A-Za-záéíóúÁÉÍÓÚñÑ\s]+$/.test(name)) {
      isValid = false;
      errorMessages.push("El nombre del producto debe contener solo letras");
    }

    // Validar precio (superior a 100)
    const price = Number(document.getElementById("edit-price").value);
    if (price < 100) {
      isValid = false;
      errorMessages.push("El precio debe ser mayor a 100 COP");
    }

    // Validar stock (mayor a 0)
    const stock = Number(document.getElementById("edit-stock").value);
    if (stock < 1 || !Number.isInteger(stock)) {
      isValid = false;
      errorMessages.push("El stock debe ser un número entero mayor a 0");
    }

    // Validar unidad (solo letras)
    const unit = document.getElementById("edit-unit").value.trim();
    if (!/^[A-Za-záéíóúÁÉÍÓÚñÑ\s]+$/.test(unit)) {
      isValid = false;
      errorMessages.push("La unidad debe contener solo letras");
    }

    // Validar descuento
    const discountPercentage = parseFloat(document.getElementById("add-discount").value || "0");
    if (discountPercentage < 0 || discountPercentage > 100) {
      isValid = false;
      errorMessages.push("El descuento debe estar entre 0 y 100%");
    }

    if (!isValid) {
      alert("Por favor corrija los siguientes errores:\n" + errorMessages.join("\n"));
      return;
    }

    const productId = $editProductForm.getAttribute("data-id");

    // Determine if we have a discount and set values accordingly
    const hasDiscount = !isNaN(discountPercentage) && discountPercentage > 0;

    // Create the product object
    const updatedProduct = {
      name: document.getElementById("edit-name").value,
      price: price,
      category: document.getElementById("edit-category").value,
      stock: parseInt(document.getElementById("edit-stock").value),
      unit: document.getElementById("edit-unit").value,
      description: document.getElementById("edit-description").value,
      // Updated discount fields
      originalPrice: hasDiscount ? originalPrice : price,
      discount: hasDiscount ? discountPercentage : 0,
      hasDiscount: hasDiscount,
    };

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedProduct),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "No se pudo actualizar el producto");
      }

      // Close modal and refresh product list
      $editProductModal.style.display = "none";
      fetchSellerProducts();
      alert("Producto actualizado correctamente");
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      alert(`Error: ${error.message}`);
    }
  });

  // Close modal
  $closeModalButton.addEventListener("click", () => {
    $editProductModal.style.display = "none";
  });

  // Delete product
  const deleteProduct = async (productId) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este producto?"))
      return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("No se pudo eliminar el producto");
      }

      // Refresh product list
      fetchSellerProducts();
      alert("Producto eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // Agregar validaciones para inputs
  const nameInput = document.getElementById("edit-name");
  const priceInput = document.getElementById("edit-price");
  const stockInput = document.getElementById("edit-stock");
  const unitInput = document.getElementById("edit-unit");
  const discountInput = document.getElementById("add-discount");

  nameInput.addEventListener("input", function () {
    // Eliminar cualquier número que se intente ingresar
    this.value = this.value.replace(/[0-9]/g, "");

    // Verificar que sea solo un nombre (sin espacios múltiples)
    const words = this.value.trim().split(/\s+/);

    // Si tiene más de 2 palabras, alertar pero no impedir
    if (words.length > 2) {
      nameInput.setCustomValidity(
        "Preferiblemente usar un solo nombre de producto"
      );
    } else {
      nameInput.setCustomValidity("");
    }
  });

  priceInput.addEventListener("input", function () {
    // Validar precio
    if (Number(this.value) < 100) {
      this.setCustomValidity("El precio debe ser mayor a 100 COP");
    } else {
      this.setCustomValidity("");
    }
  });

  stockInput.addEventListener("input", function () {
    // Validar stock
    if (Number(this.value) < 1) {
      this.setCustomValidity("El stock debe ser mayor a 0");
    } else {
      this.setCustomValidity("");
    }
  });

  unitInput.addEventListener("input", function () {
    // Eliminar números de la unidad
    this.value = this.value.replace(/[0-9]/g, "");

    if (!/^[A-Za-záéíóúÁÉÍÓÚñÑ\s]+$/.test(this.value)) {
      this.setCustomValidity("La unidad solo debe contener letras");
    } else {
      this.setCustomValidity("");
    }
  });

  discountInput.addEventListener("input", function () {
    // Validar descuento
    const discountValue = Number(this.value);
    if (discountValue < 0 || discountValue > 100) {
      this.setCustomValidity("El descuento debe estar entre 0 y 100%");
    } else {
      this.setCustomValidity("");
    }
  });

  // Initial load of products
  fetchSellerProducts();
});