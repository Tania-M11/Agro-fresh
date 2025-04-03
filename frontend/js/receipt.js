document.addEventListener("DOMContentLoaded", function() {
    // Recuperar la información de la última orden
    const lastOrderString = localStorage.getItem("lastOrder");
    
    if (!lastOrderString) {
        // Si no hay información de orden, redirigir al inicio
        alert("No se encontró información de la orden");
        window.location.href = "main.html";
        return;
    }
    
    const lastOrder = JSON.parse(lastOrderString);
    
    // Mostrar información de la orden en el recibo
    document.getElementById("order-id").textContent = lastOrder.orderId;
    
    // Formatear la fecha
    const orderDate = new Date(lastOrder.date);
    const formattedDate = orderDate.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById("order-date").textContent = formattedDate;
    
    // Mostrar método de pago
    const paymentMethodElement = document.getElementById("payment-method");
    const cashInstructionsElement = document.getElementById("cash-instructions");
    const paymentCodeElement = document.getElementById("payment-code");
    
    // Traducir el método de pago a español
    let paymentMethodText = "";
    switch(lastOrder.paymentMethod) {
        case 'cash':
            paymentMethodText = "Efectivo";
            // Mostrar instrucciones para pago en efectivo
            cashInstructionsElement.style.display = "block";
            paymentCodeElement.textContent = lastOrder.paymentCode;
            break;
        case 'credit-card':
            paymentMethodText = "Tarjeta de crédito";
            break;
        case 'pse':
            paymentMethodText = "PSE";
            break;
        case 'gift-card':
            paymentMethodText = "Tarjeta de regalo";
            break;
        case 'pay-later':
            paymentMethodText = "Pagar después";
            break;
        case 'mercadopago':
            paymentMethodText = "MercadoPago";
            break;
        default:
            paymentMethodText = lastOrder.paymentMethod;
    }
    
    paymentMethodElement.textContent = paymentMethodText;
    
    // Renderizar los items de la orden
    const receiptItemsContainer = document.getElementById("receipt-items");
    receiptItemsContainer.innerHTML = "";
    
    lastOrder.items.forEach(item => {
        const itemDiv = document.createElement("div");
        itemDiv.classList.add("receipt-item");
        
        // Determinar la URL de la imagen
        let imageUrl = 'img/default-product.png';
        if (item.image) {
            imageUrl = `http://localhost:3001${item.image}`;
        }
        
        itemDiv.innerHTML = `
            <div class="item-image">
                <img src="${imageUrl}" alt="${item.name}" onerror="this.src='img/default-product.png'">
            </div>
            <div class="item-details">
                <p class="item-name">${item.name}</p>
                <p class="item-price">Precio: $${item.price.toFixed(2)}</p>
                <p class="item-quantity">Cantidad: ${item.quantity}</p>
                <p class="item-total">Total: $${(item.price * item.quantity).toFixed(2)}</p>
            </div>
        `;
        
        receiptItemsContainer.appendChild(itemDiv);
    });
    
    // Mostrar totales
    document.getElementById("subtotal-amount").textContent = `$${lastOrder.subtotal.toFixed(2)}`;
    document.getElementById("shipping-amount").textContent = `$${lastOrder.shippingCost.toFixed(2)}`;
    document.getElementById("total-amount").textContent = `$${lastOrder.total.toFixed(2)}`;
    
    // Actualizar contador del carrito (debería ser 0 después de la compra)
    updateCartCounter();
});

// Actualizar contador del carrito
function updateCartCounter() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    
    const cartCounter = document.getElementById("cart-counter");
    if (cartCounter) {
        cartCounter.textContent = totalItems;
    }
}