const signUpButton = document.getElementById("signUp");
const signInButton = document.getElementById("signIn");
const container = document.getElementById("container");
const registro = document.getElementById("register-form");
const login = document.getElementById("login-form");
const mensajeErrorRegistro = document.querySelector(".error-register");
const mensajeErrorLogin = document.querySelector(".error-login");

// Alternar entre login y registro
signUpButton.addEventListener("click", () => container.classList.add("right-panel-active"));
signInButton.addEventListener("click", () => container.classList.remove("right-panel-active"));

// REGISTRO
registro.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(registro);
  const user = formData.get("user").trim();
  const identification = formData.get("identification").trim();
  const email = formData.get("email").trim();
  const password = formData.get("password");
  const passwordVerification = formData.get("passwordVerification");
  const phone = formData.get("phone").trim(); // Added phone number
  const role = document.getElementById("rol").value;
  
  // Validaciones antes de enviar
  if (!user || !identification || !email || !password || !passwordVerification || !phone) {
    mostrarError("Todos los campos son obligatorios.", "registro");
    return;
  }

  // Phone number validation (basic example - adjust as needed)
  const phoneRegex = /^[0-9]{10}$/; // Assumes 10-digit phone number
  if (!phoneRegex.test(phone)) {
    mostrarError("Por favor, ingrese un número de teléfono válido (10 dígitos).", "registro");
    return;
  }

  if (password !== passwordVerification) {
    mostrarError("Las contraseñas no coinciden.", "registro");
    return;
  }

  try {
    const response = await fetch("https://agro-fresh-backend.onrender.com/api/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ 
    user, 
    identification, 
    email, 
    password, 
    passwordVerification, 
    role,
    phone // Added phone to the request body
  })
});

    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Error en el registro");
    
    mostrarMensaje("Registro exitoso. ¡Ya puedes iniciar sesión!", "registro", "green");
    registro.reset();
    setTimeout(() => container.classList.remove("right-panel-active"), 2000);
  } catch (error) {
    mostrarError(error.message, "registro");
  }
});

// LOGIN
login.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(login);
  const email = formData.get("mainUser").trim();
  const password = formData.get("mainPasword");
  
  if (!email || !password) {
    mostrarError("Debes completar todos los campos.", "login");
    return;
  }

  try {
    const response =  await fetch("https://agro-fresh-backend.onrender.com/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Error en el inicio de sesión");
    
    // Guardar el token JWT, el rol y el teléfono del usuario en localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("userToken", data.token);
    localStorage.setItem("userRole", data.role);
    localStorage.setItem("userPhone", data.phone); // Store phone number
    
    // Redirigir según el rol del usuario
    if (data.role === "vendedor") {
      window.location.href = "seller.html";
    } else {
      window.location.href = "main.html";
    }
  } catch (error) {
    mostrarError(error.message, "login");
  }
});

// Funciones auxiliares
function mostrarError(mensaje, tipo) {
  const mensajeError = tipo === "registro" ? mensajeErrorRegistro : mensajeErrorLogin;
  mensajeError.textContent = mensaje;
  mensajeError.style.color = "red";
  mensajeError.classList.remove("hidden");
}

function mostrarMensaje(mensaje, tipo, color) {
  const mensajeError = tipo === "registro" ? mensajeErrorRegistro : mensajeErrorLogin;
  mensajeError.textContent = mensaje;
  mensajeError.style.color = color;
  mensajeError.classList.remove("hidden");
}



// Función para verificar si estamos en móvil
function isMobile() {
  return window.innerWidth <= 768;
}

// Función para manejar cambios entre formularios
function switchForms() {
  if (isMobile()) {
    // En móvil, solo añadimos/quitamos la clase
    container.classList.toggle('right-panel-active');
    
    // Scroll al inicio del formulario visible
    window.scrollTo({
      top: container.offsetTop,
      behavior: 'smooth'
    });
  } else {
    // En desktop, comportamiento original
    if (this.id === 'signUp') {
      container.classList.add('right-panel-active');
    } else {
      container.classList.remove('right-panel-active');
    }
  }
}

// Event listeners para los botones
signUpButton.addEventListener('click', switchForms);
signInButton.addEventListener('click', switchForms);

// Función para manejar cambios de tamaño de pantalla
function handleResize() {
  if (isMobile()) {
    // Verificar si el elemento mobile-switcher ya existe
    if (!document.querySelector('.mobile-switcher')) {
      createMobileSwitcher();
    }
  } else {
    // Eliminar el mobile-switcher si existe y no estamos en móvil
    const mobileSwitcher = document.querySelector('.mobile-switcher');
    if (mobileSwitcher) {
      mobileSwitcher.remove();
    }
    
    // Restaurar la estructura original si es necesario
    const overlayContainer = document.querySelector('.overlay-container');
    if (overlayContainer && overlayContainer.style.display === 'none') {
      overlayContainer.style.display = '';
    }
  }
}

// Crear el elemento mobile-switcher para la versión móvil
function createMobileSwitcher() {
  
  const overlayContainer = document.querySelector('.overlay-container');
  
  // Ocultar el overlay container original
  if (overlayContainer) {
    overlayContainer.style.display = 'none';
  }
  
  // Crear el nuevo switcher móvil
  const mobileSwitcher = document.createElement('div');
  mobileSwitcher.className = 'mobile-switcher';
  
  // Contenido inicial (depende de qué formulario esté activo)
  const isSignUp = container.classList.contains('right-panel-active');
  updateMobileSwitcherContent(mobileSwitcher, isSignUp);
  
  // Añadir el switcher al final del contenedor
  container.appendChild(mobileSwitcher);
}

// Actualizar el contenido del switcher móvil según el estado
function updateMobileSwitcherContent(switcher, isSignUp) {
  // Tomar contenido del panel correspondiente
  const leftPanel = document.querySelector('.overlay-left');
  const rightPanel = document.querySelector('.overlay-right');
  
  if (isSignUp) {
    // Estamos en registro, mostrar contenido del panel izquierdo
    switcher.innerHTML = leftPanel.innerHTML;
  } else {
    // Estamos en login, mostrar contenido del panel derecho
    switcher.innerHTML = rightPanel.innerHTML;
  }
  
  // Reajustar event listeners en los botones dentro del switcher
  const switcherButton = switcher.querySelector('button');
  if (switcherButton) {
    switcherButton.addEventListener('click', switchForms);
  }
}

// Observar cambios en el estado del contenedor para actualizar el switcher
function observeContainerChanges() {
  if (isMobile()) {
    const mobileSwitcher = document.querySelector('.mobile-switcher');
    if (mobileSwitcher) {
      const isSignUp = container.classList.contains('right-panel-active');
      updateMobileSwitcherContent(mobileSwitcher, isSignUp);
    }
  }
}

// Configurar un MutationObserver para detectar cambios en las clases del contenedor
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'class') {
      observeContainerChanges();
    }
  });
});

// Iniciar el observer
observer.observe(container, { attributes: true });

// Ejecutar la función de resize al cargar y cuando cambie el tamaño
window.addEventListener('load', handleResize);
window.addEventListener('resize', handleResize);


