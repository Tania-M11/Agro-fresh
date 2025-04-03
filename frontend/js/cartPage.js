document.addEventListener("DOMContentLoaded", function() {
    // Check if user is logged in
    const userToken = localStorage.getItem("userToken");
    
    if (!userToken) {
        // Redirect to login if no token exists
        window.location.href = "register.html";
        return;
    }
    
    // Load user data and cart
    fetchUserData();
    loadCartItems();
    
    // Setup payment method selection
    setupPaymentMethodSelection();
});

// --- USER DATA MANAGEMENT ---
async function fetchUserData() {
    try {
        const token = localStorage.getItem("userToken");
        
        const response = await fetch("http://localhost:3001/api/profile", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error("No se pudo obtener la información de sus datos");
        }
        
        const userData = await response.json();
        
        // Update user data section
        document.getElementById('user-email').innerHTML = `
            ${userData.email} - <a href="./register.html">No soy yo, cerrar sesión</a>
        `;
        document.getElementById('user-name').textContent = userData.user || 'No especificado';
        document.getElementById('user-phone').textContent = userData.phone || 'No registrado';
        
        // Populate form fields
        document.getElementById('user-email-input').value = userData.email || '';
        document.getElementById('user-name-input').value = userData.user || '';
        document.getElementById('user-id-input').value = userData.identification || '';
        document.getElementById('user-phone-input').value = userData.phone || '';
        document.getElementById('newsletter').checked = userData.newsletter || false;
        
    } catch (error) {
        console.error("Error al cargar datos de usuario:", error);
        alert("Error al cargar la información. Por favor, inténtalo de nuevo más tarde.");
    }
}

async function saveUserData() {
    const email = document.getElementById('user-email-input').value.trim();
    const name = document.getElementById('user-name-input').value.trim();
    const identification = document.getElementById('user-id-input').value.trim();
    const phone = document.getElementById('user-phone-input').value.trim();
    const newsletter = document.getElementById('newsletter').checked;
    const terms = document.getElementById('terms').checked;
    const privacy = document.getElementById('privacy').checked;
    
    // Updated Validations - Only email and phone are required
    if (!email) {
        alert("Por favor, ingrese su correo electrónico.");
        return;
    }
    
    if (!phone) {
        alert("Por favor, ingrese su número de teléfono.");
        return;
    }
    
    if (!terms || !privacy) {
        alert("Debe aceptar los Términos y Condiciones y el Aviso de Privacidad.");
        return;
    }
    
    try {
        const token = localStorage.getItem("userToken");
        
        const response = await fetch("http://localhost:3001/api/profile/update", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                email: email,
                user: name,          // Keep other fields optional
                identification: identification,
                phone: phone,
                newsletter: newsletter
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || "Error al actualizar sus datos");
        }
        
        // Refresh user data after successful update
        await fetchUserData();
        
        alert("Datos actualizados con éxito");
        
        // Close the form
        closeUserDataForm();
    } catch (error) {
        console.error("Error al actualizar sus datos:", error);
        alert(error.message || "Error al actualizar sus datos");
    }
}

// Update the form field labels to indicate which are required
function setupFormFields() {
    // Add this to your initialization code or in a function that sets up the form
    const emailLabel = document.querySelector('label[for="user-email-input"]');
    if (emailLabel) emailLabel.innerHTML = "Correo electrónico * <small>(obligatorio)</small>";
    
    const phoneLabel = document.querySelector('label[for="user-phone-input"]');
    if (phoneLabel) phoneLabel.innerHTML = "Teléfono * <small>(obligatorio)</small>";
    
    // Optional fields
    const nameLabel = document.querySelector('label[for="user-name-input"]');
    if (nameLabel) nameLabel.innerHTML = "Nombre <small>(opcional)</small>";
    
    const idLabel = document.querySelector('label[for="user-id-input"]');
    if (idLabel) idLabel.innerHTML = "Identificación <small>(opcional)</small>";
}

// Call this function when the page loads
document.addEventListener("DOMContentLoaded", function() {
   
    setupFormFields();
});




// --- CART MANAGEMENT ---
function loadCartItems() {
    const cartItemsContainer = document.querySelector(".cart-items");
    
    // Get cart from localStorage
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = "<p>El carrito está vacío</p>";
        updateTotals();
        return;
    }
    
    cartItemsContainer.innerHTML = "";
    
    cart.forEach(function(item, index) {
        const cartItemDiv = document.createElement("div");
        cartItemDiv.classList.add("cart-item");
        
        // Determine image URL - FIXED PATH
        let imageUrl = 'img/default-product.png'; // Default image path
        
        if (item.image) {
            // Make sure the path is correct to the uploads directory
            imageUrl = `http://localhost:3001/uploads/${item.image.split('/').pop()}`;
        } else if (item.imageUrl) {
            imageUrl = item.imageUrl;
        }
        
        // Prepare price display with discount if applicable
        let priceDisplay;
        if (item.hasDiscount && item.originalPrice) {
            priceDisplay = `
                <p>
                    <span class="original-price">$${item.originalPrice.toFixed(2)}</span>
                    <span class="discounted-price">$${item.price.toFixed(2)}</span>
                </p>
            `;
        } else {
            priceDisplay = `<p>$ ${item.price.toFixed(2)}</p>`;
        }
        
        cartItemDiv.innerHTML = `
            <img src="${imageUrl}" alt="${item.name}" onerror="this.src='img/default-product.png'" />
            <div class="cart-item-details">
                <p>${item.name}</p>
                <div class="item-quantity">
                    <button class="cantidad-btn disminuir" data-index="${index}">-</button>
                    <span class="cantidad-valor">${item.quantity}</span>
                    <button class="cantidad-btn aumentar" data-index="${index}">+</button>
                    <span class="eliminaProducto" data-index="${index}">
                        <img src="img/trash.svg" alt="trash">
                    </span>
                </div>
                ${priceDisplay}
            </div>
        `;
        
        cartItemsContainer.appendChild(cartItemDiv);
    });

    attachQuantityListeners();
    updateTotals();
}



function updateQuantity(index, change) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    
    if (change === -1 && cart[index].quantity <= 1) {
        cart.splice(index, 1);
    } else {
        cart[index].quantity += change;
    }
    
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCartItems();
}

function attachQuantityListeners() {
    document.querySelectorAll(".cantidad-btn.disminuir").forEach(btn => {
        btn.addEventListener("click", e => {
            updateQuantity(parseInt(e.currentTarget.getAttribute("data-index")), -1);
        });
    });
    
    document.querySelectorAll(".cantidad-btn.aumentar").forEach(btn => {
        btn.addEventListener("click", e => {
            updateQuantity(parseInt(e.currentTarget.getAttribute("data-index")), 1);
        });
    });
    
    document.querySelectorAll(".eliminaProducto").forEach(btn => {
        btn.addEventListener("click", e => {
            let cart = JSON.parse(localStorage.getItem("cart")) || [];
            cart.splice(parseInt(e.currentTarget.getAttribute("data-index")), 1);
            localStorage.setItem("cart", JSON.stringify(cart));
            loadCartItems();
        });
    });
}

function updateTotals() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    
    const subtotal = cart.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
    
    const shippingCost = 9200;
    const saving = cart.reduce((total, item) => {
        if (item.hasDiscount && item.originalPrice) {
            return total + ((item.originalPrice - item.price) * item.quantity);
        }
        return total;
    }, 0);
    
    const total = subtotal + shippingCost;
    
    document.getElementById('subtotal-amount').textContent = `$ ${subtotal.toFixed(2)}`;
    document.getElementById('savings-amount').textContent = `$ ${saving.toFixed(2)}`;
    document.getElementById('shipping-amount').textContent = `$ ${shippingCost.toFixed(2)}`;
    document.getElementById('total-amount').textContent = `$ ${total.toFixed(2)}`;
    
    // Enable/disable checkout button based on cart items
    const buyNowButton = document.querySelector(".comprar-ahora-btn");
    if (buyNowButton) {
        buyNowButton.disabled = cart.length === 0;
    }
}

// --- FORM HANDLING ---
function openUserDataForm() {
    document.getElementById('user-data-form').style.display = "flex";
}

function closeUserDataForm() {
    document.getElementById('user-data-form').style.display = "none";
}

function openShippingForm() {
    document.getElementById('shipping-form').style.display = "flex";
}

function closeShippingForm() {
    document.getElementById('shipping-form').style.display = "none";
}

// --- PAYMENT METHOD HANDLING ---
function setupPaymentMethodSelection() {
    const paymentMethods = document.querySelectorAll(".payment-method");
    
    paymentMethods.forEach(method => {
        method.addEventListener("click", function() {
            // Remove the 'selected' class from all methods
            paymentMethods.forEach(item => item.classList.remove("selected"));
            
            // Add the 'selected' class only to the clicked element
            this.classList.add("selected");
            
            // Mostrar información adicional para el método de pago seleccionado
            const paymentMethod = this.getAttribute("data-method");
            updatePaymentMethodInfo(paymentMethod);
        });
    });
    
    // Seleccionar efectivo por defecto (como estamos implementando solo este método)
    const cashPaymentMethod = document.querySelector(".payment-method[data-method='cash']");
    if (cashPaymentMethod) {
        cashPaymentMethod.click();
    }
}

function updatePaymentMethodInfo(method) {
    // Aquí puedes agregar información específica para cada método de pago
    // Por ejemplo, mostrar instrucciones para el pago en efectivo
    const infoContainer = document.getElementById("payment-method-info");
    
    if (!infoContainer) return;
    
    switch(method) {
        case 'cash':
            infoContainer.innerHTML = `
                <div class="payment-method-instructions">
                    <h4>Pago en Efectivo</h4>
                    <p>Al finalizar tu compra, recibirás un código de referencia que puedes utilizar 
                    para pagar en cualquier punto de pago autorizado dentro de las próximas 24 horas.</p>
                </div>
            `;
            break;
        case 'credit-card':
            infoContainer.innerHTML = `
                <div class="payment-method-instructions">
                    <h4>Pago con Tarjeta</h4>
                    <p>Este método de pago aún no está disponible.</p>
                </div>
            `;
            break;
        // Puedes agregar más casos para otros métodos de pago
        default:
            infoContainer.innerHTML = `
                <div class="payment-method-instructions">
                    <h4>Método de pago seleccionado</h4>
                    <p>Este método de pago aún no está disponible.</p>
                </div>
            `;
    }
}

// Agregar este contenedor después de la sección de métodos de pago en el HTML
document.addEventListener("DOMContentLoaded", function() {
    const paymentMethods = document.querySelector(".payment-methods");
    
    if (paymentMethods) {
        const infoContainer = document.createElement("div");
        infoContainer.id = "payment-method-info";
        infoContainer.classList.add("payment-method-info");
        
        // Insertar después de la sección de métodos de pago
        paymentMethods.parentNode.insertBefore(infoContainer, paymentMethods.nextSibling);
    }
    
    // Configurar selección de método de pago
    setupPaymentMethodSelection();
});



// --- CHECKOUT HANDLING ---
document.addEventListener("DOMContentLoaded", function() {
    const comprarAhoraBtn = document.querySelector(".comprar-ahora-btn");
    
    if (comprarAhoraBtn) {
        console.log("Botón 'Comprar ahora' encontrado, asignando event listener");
        
        comprarAhoraBtn.addEventListener("click", async function() {
            console.log("Botón 'Comprar ahora' clickeado");
            
            const cart = JSON.parse(localStorage.getItem("cart")) || [];
            
            if (cart.length === 0) {
                alert("El carrito está vacío");
                return;
            }
            
            const selectedPayment = document.querySelector(".payment-method.selected");
            
            if (!selectedPayment) {
                alert("Por favor seleccione un método de pago");
                return;
            }
            
            const paymentMethod = selectedPayment.getAttribute("data-method");
            
            try {
                // Obtener el token del usuario
                const token = localStorage.getItem("userToken");
                if (!token) {
                    alert("Debe iniciar sesión para completar la compra");
                    window.location.href = "register.html";
                    return;
                }
                
                // Preparar los items para la orden
                const orderItems = cart.map(item => ({
                    productId: item.id || item._id || item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                }));
                
                // Calcular el total
                const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
                const shippingCost = 9200;
                const total = subtotal + shippingCost;
                
                console.log("Enviando orden al servidor...");
                
                // Crear la orden en el backend
                const response = await fetch("http://localhost:3001/api/orders", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        items: orderItems,
                        shippingCost: shippingCost,
                        totalPrice: total,
                        paymentMethod: paymentMethod
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Error al procesar la orden");
                }
                
                const orderData = await response.json();
                console.log("Orden creada con éxito:", orderData);
                
                // Generar código de pago para efectivo
                const paymentCode = 'RF-' + generateRandomCode(9);
                
                // Guardar la información de la orden en localStorage para acceder en la página de recibo
                localStorage.setItem("lastOrder", JSON.stringify({
                    orderId: orderData.newOrder._id,
                    items: cart,
                    subtotal: subtotal,
                    shippingCost: shippingCost,
                    total: total,
                    paymentMethod: paymentMethod,
                    paymentCode: paymentMethod === 'cash' ? paymentCode : null,
                    date: new Date().toISOString()
                }));
                
                // Vaciar el carrito después de la compra exitosa
                localStorage.setItem("cart", JSON.stringify([]));
                
                console.log("Redirigiendo a página de recibo...");
                
                // Redirigir a la página de recibo
                window.location.href = "receipt.html";
                
            } catch (error) {
                console.error("Error al procesar la compra:", error);
                alert("Error al procesar la compra: " + error.message);
            }
        });
    } else {
        console.error("No se encontró el botón 'Comprar ahora'");
    }
});

// Función para generar un código aleatorio para pagos en efectivo
function generateRandomCode(length) {
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}