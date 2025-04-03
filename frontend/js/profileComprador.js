document.addEventListener("DOMContentLoaded", function() {
    // Comprobar si hay un userRole y un token en localStorage
    const userRole = localStorage.getItem("userRole");
    const userToken = localStorage.getItem("userToken");
    
    if (!userRole || !userToken) {
        // Si no hay rol de usuario o token, redirigir al inicio de sesión
        window.location.href = "register.html";
        return;
    }
    
    // Verificar si estamos en la página correcta según el rol
    if (userRole === "vendedor" && window.location.pathname.includes("profileComprador.html")) {
        window.location.href = "profileVendedor.html"; // Redirigir a vendedor si es necesario
        return;
    }
    
    if (userRole === "comprador" && window.location.pathname.includes("profileVendedor.html")) {
        window.location.href = "profileComprador.html"; // Redirigir a comprador si es necesario
        return;
    }
    
    // Obtener datos del usuario actual
    fetchUserProfile();
    
    // Configurar listeners para los botones
    document.getElementById("btn-logout").addEventListener("click", logout);
    document.getElementById("btn-edit").addEventListener("click", openEditModal);
    document.querySelector(".close").addEventListener("click", closeEditModal);
    document.getElementById("btn-cancel").addEventListener("click", closeEditModal);
    document.getElementById("edit-form").addEventListener("submit", updateProfile);
    
    // Configurar los toggles de contraseña
    setupPasswordToggles();
});

// Función para configurar los botones de toggle de contraseña
function setupPasswordToggles() {
    const toggleButtons = document.querySelectorAll('.password-toggle');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Prevenir que el botón envíe el formulario
            e.preventDefault();
            
            const passwordInput = this.previousElementSibling;
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
    });
}

// Función para obtener los datos del perfil
async function fetchUserProfile() {
    try {
        // Obtener el token de localStorage
        const token = localStorage.getItem("userToken");
        
        const response = await fetch("http://localhost:3001/api/profile", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error("No se pudo obtener la información del perfil");
        }
        
        const userData = await response.json();
        
        // Actualizar la interfaz con los datos del usuario
        document.getElementById("user-name").textContent = userData.user;
        document.getElementById("user-fullname").textContent = userData.user;
        document.getElementById("user-id").textContent = userData.identification;
        document.getElementById("user-email").textContent = userData.email;
        document.getElementById("user-role").textContent = 
            userData.role === "comprador" ? "Comprador" : "Vendedor";
        
        // Prellenar el formulario de edición
        document.getElementById("edit-name").value = userData.user;
        document.getElementById("edit-email").value = userData.email;
        // Limpiamos los campos de contraseña por seguridad
        document.getElementById("edit-password").value = "";
        document.getElementById("edit-confirm-password").value = "";
    } catch (error) {
        console.error("Error al cargar el perfil:", error);
        alert("Error al cargar la información del perfil. Por favor, inténtalo de nuevo más tarde.");
    }
}

// Función para cerrar sesión
function logout() {
    // Limpiar datos de sesión
    localStorage.removeItem("userRole");
    localStorage.removeItem("userToken");
    // Otros datos que necesites eliminar...
    
    // Redirigir al inicio de sesión
    window.location.href = "register.html";
}

// Funciones para el modal de edición
function openEditModal() {
    document.getElementById("edit-modal").style.display = "block";
}

function closeEditModal() {
    document.getElementById("edit-modal").style.display = "none";
}

// Función para actualizar el perfil
async function updateProfile(e) {
    e.preventDefault();
    
    const user = document.getElementById("edit-name").value.trim();
    const email = document.getElementById("edit-email").value.trim();
    const password = document.getElementById("edit-password").value;
    const passwordVerification = document.getElementById("edit-confirm-password").value;
    
    // Validaciones básicas
    if (!user || !email) {
        alert("Por favor, completa todos los campos obligatorios");
        return;
    }
    
    // Validar que las contraseñas coincidan si se está cambiando
    if (password && password !== passwordVerification) {
        alert("Las contraseñas no coinciden");
        return;
    }
    
    // Preparar datos para enviar
    const userData = {
        user,
        email
    };
    
    // Incluir la contraseña solo si se está cambiando
    if (password) {
        userData.password = password;
        userData.passwordVerification = passwordVerification;
    }
    
    try {
        // Obtener el token de localStorage
        const token = localStorage.getItem("userToken");
        
        const response = await fetch("http://localhost:3001/api/profile/update", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || "Error al actualizar el perfil");
        }
        
        alert("Perfil actualizado con éxito");
        closeEditModal();
        
        // Recargar la información del perfil
        fetchUserProfile();
    } catch (error) {
        console.error("Error al actualizar el perfil:", error);
        alert(error.message || "Error al actualizar el perfil");
    }
}