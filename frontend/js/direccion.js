// address-handler.js - Versión actualizada
document.addEventListener("DOMContentLoaded", function() {
    // Inicializar el módulo de dirección
    initAddressModule();
    
    // Cargar direcciones guardadas
    fetchUserAddresses();
});

/**
 * Inicializa el módulo de manejo de direcciones
 */
function initAddressModule() {
    // Configurar validación del formulario
    setupAddressFormValidation();
    
    // Configurar listeners para el formulario
    const addressForm = document.getElementById('addressForm');
    if (addressForm) {
        // Cambiar el evento del botón "Ir al pago" para que guarde la dirección
        const continueBtn = addressForm.querySelector('.continue-btn');
        if (continueBtn) {
            continueBtn.onclick = function(e) {
                e.preventDefault();
                if (validateAddressForm()) {
                    saveAddressData();
                }
            };
        }
        
        // Configurar el botón de cancelar
        const cancelBtn = addressForm.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.onclick = function(e) {
                e.preventDefault();
                closeShippingForm();
            };
        }
    }
}

/**
 * Configura las validaciones para cada campo del formulario
 */
function setupAddressFormValidation() {
    // Validación para el código postal (solo números)
    const postalCodeInput = document.querySelector('input[name="postalCode"]');
    if (postalCodeInput) {
        postalCodeInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }
    
    // Validación para el número (puede contener letras, números y caracteres especiales comunes en direcciones)
    const numberInput = document.querySelector('input[name="number"]');
    if (numberInput) {
        numberInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^a-zA-Z0-9\-\/]/g, '');
        });
    }
    
    // Validación para barrio y calle (no debe contener caracteres especiales excepto espacios y guiones)
    const streetInput = document.querySelector('input[name="street"]');
    const neighborhoodInput = document.querySelector('input[name="neighborhood"]');
    
    [streetInput, neighborhoodInput].forEach(input => {
        if (input) {
            input.addEventListener('input', function(e) {
                this.value = this.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-]/g, '');
            });
        }
    });
    
    // Validación para destinatario (solo letras y espacios)
    const recipientInput = document.querySelector('input[name="recipient"]');
    if (recipientInput) {
        recipientInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        });
    }
}

/**
 * Valida todos los campos del formulario antes de enviar
 */
function validateAddressForm() {
    const form = document.getElementById('addressForm');
    
    // Verificar que los campos requeridos estén completos
    const requiredFields = ['type', 'street', 'number', 'neighborhood', 'city', 'state', 'postalCode', 'recipient'];
    
    for (let field of requiredFields) {
        const input = form.querySelector(`[name="${field}"]`);
        if (!input || !input.value.trim()) {
            alert(`Por favor complete el campo: ${getFieldLabel(field)}`);
            if (input) input.focus();
            return false;
        }
    }
    
    // Validar formato del código postal (debe ser numérico y tener entre 5-6 dígitos)
    const postalCode = form.querySelector('[name="postalCode"]').value;
    if (!/^\d{5,6}$/.test(postalCode)) {
        alert('El código postal debe contener entre 5 y 6 dígitos');
        form.querySelector('[name="postalCode"]').focus();
        return false;
    }
    
    return true;
}

/**
 * Obtiene la etiqueta para un campo basado en su nombre
 */
function getFieldLabel(fieldName) {
    const labels = {
        type: 'Tipo de dirección',
        street: 'Calle',
        number: 'Número',
        neighborhood: 'Barrio',
        city: 'Municipio',
        state: 'Departamento',
        postalCode: 'Código Postal',
        recipient: 'Destinatario'
    };
    
    return labels[fieldName] || fieldName;
}

/**
 * Guarda los datos de la dirección en la base de datos
 */
/**
 * Guarda los datos de la dirección en la base de datos
 */
async function saveAddressData() {
    if (!validateAddressForm()) {
        return;
    }
    
    try {
        const token = localStorage.getItem("userToken");
        if (!token) {
            alert("Debe iniciar sesión para guardar su dirección");
            window.location.href = "register.html";
            return;
        }
        
        const form = document.getElementById('addressForm');
        const formData = {
            type: form.querySelector('[name="type"]').value,
            street: form.querySelector('[name="street"]').value,
            number: form.querySelector('[name="number"]').value,
            neighborhood: form.querySelector('[name="neighborhood"]').value,
            city: form.querySelector('[name="city"]').value,
            state: form.querySelector('[name="state"]').value,
            postalCode: form.querySelector('[name="postalCode"]').value,
            reference: form.querySelector('[name="reference"]').value || '',
            recipient: form.querySelector('[name="recipient"]').value,
            extraInfo: form.querySelector('[name="extraInfo"]').value || '',
            isDefault: true // Marcar como dirección por defecto
        };

        // También guardar en localStorage por si necesitamos acceder a estos valores en otras partes
        localStorage.setItem('shippingExtraInfo', formData.extraInfo);
        localStorage.setItem('shippingRecipient', formData.recipient);
        
        // Mostrar indicador de carga si existe
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) loadingIndicator.style.display = 'block';
        
        console.log("Enviando datos:", formData);
        console.log("Token:", token);
        
        const response = await fetch("http://localhost:3001/api/addresses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        // Ocultar indicador de carga
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        
        // Verificar si la respuesta es JSON válido
        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            data = await response.json();
        } else {
            // Si no es JSON, obtener el texto de la respuesta
            const text = await response.text();
            throw new Error(`Respuesta no JSON: ${text}`);
        }
        
        if (!response.ok) {
            throw new Error(data.message || "Error al guardar la dirección");
        }
        
        // Actualizar la UI con la nueva dirección
        updateShippingUI(formData);
        
        // Cerrar el formulario
        closeShippingForm();
        
        alert("Dirección guardada con éxito");
    } catch (error) {
        console.error("Error al guardar la dirección:", error);
        alert(`Error al guardar la dirección: ${error.message}`);
    }
}

/**
 * Obtiene las direcciones guardadas del usuario
 */
async function fetchUserAddresses() {
    try {
        const token = localStorage.getItem("userToken");
        if (!token) return;
        
        const response = await fetch("http://localhost:3001/api/addresses", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        
        // Verificar si la respuesta es JSON válido
        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            data = await response.json();
        } else {
            // Si no es JSON, no hay direcciones o hay un error
            console.log("No se recibieron direcciones en formato JSON");
            return;
        }
        
        if (!response.ok) {
            console.log("Error al obtener direcciones:", data.message);
            return;
        }
        
        // Si hay direcciones, mostrar la dirección por defecto
        if (data.addresses && data.addresses.length > 0) {
            // Buscar la dirección por defecto
            const defaultAddress = data.addresses.find(addr => addr.isDefault) || data.addresses[0];
            updateShippingUI(defaultAddress);
        }
    } catch (error) {
        console.error("Error al cargar direcciones:", error);
    }
}

/**
 * Actualiza la UI con la información de envío
 */
function updateShippingUI(address) {
    // Actualizar la información en la sección de envío
    document.getElementById('shipping-address').textContent = 
        `${address.street} #${address.number}, ${address.neighborhood}`;
    document.getElementById('shipping-postal').textContent = address.postalCode;
    document.getElementById('shipping-city').textContent = `${address.city}, ${address.state}`;
    
    // Verificar y mostrar información adicional y destinatario
    // Usar la información del objeto address si está disponible, sino usar localStorage
    const extraInfo = address.extraInfo || localStorage.getItem('shippingExtraInfo');
    const recipient = address.recipient || localStorage.getItem('shippingRecipient');
    
    // Si existen estos elementos en el DOM, actualizarlos
    const extraInfoElement = document.getElementById('shipping-extra-info');
    const recipientElement = document.getElementById('shipping-recipient');
    
    if (extraInfoElement && extraInfo) {
        extraInfoElement.textContent = extraInfo;
    }
    
    if (recipientElement && recipient) {
        recipientElement.textContent = recipient;
    }
    
    // Agregar estos elementos al DOM si no existen pero tenemos la información
    const shippingInfoDiv = document.querySelector('.shipping-info div');
    
    if (shippingInfoDiv) {
        if (!extraInfoElement && extraInfo) {
            const extraInfoP = document.createElement('p');
            extraInfoP.innerHTML = `<strong>Información adicional:</strong> <span id="shipping-extra-info">${extraInfo}</span>`;
            shippingInfoDiv.appendChild(extraInfoP);
        }
        
        if (!recipientElement && recipient) {
            const recipientP = document.createElement('p');
            recipientP.innerHTML = `<strong>Destinatario:</strong> <span id="shipping-recipient">${recipient}</span>`;
            shippingInfoDiv.appendChild(recipientP);
        }
    }
}

// Función para cerrar el formulario de envío (definida en el script original)
function closeShippingForm() {
    document.getElementById('shipping-form').style.display = "none";
}