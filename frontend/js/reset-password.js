document.addEventListener('DOMContentLoaded', function() {
    const resetForm = document.getElementById('reset-password-form');
    const resetError = document.getElementById('reset-error');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    // Crear indicador de fortaleza de contraseña
    const strengthIndicator = document.createElement('div');
    strengthIndicator.className = 'password-strength';
    strengthIndicator.innerHTML = `
        <div class="strength-meter">
            <div class="strength-meter-fill"></div>
        </div>
        <div class="strength-text"></div>
    `;
    
    // Insertar después del primer campo de contraseña
    newPasswordInput.parentNode.insertAdjacentElement('afterend', strengthIndicator);
    
    // Agregar estilos para el indicador de fortaleza
    const style = document.createElement('style');
    style.textContent = `
        .password-strength {
            margin-bottom: 15px;
            text-align: left;
            font-size: 12px;
        }
        .strength-meter {
            height: 4px;
            background-color: #ddd;
            margin-top: 5px;
            border-radius: 2px;
            overflow: hidden;
        }
        .strength-meter-fill {
            height: 100%;
            width: 0;
            transition: width 0.3s ease;
        }
        .strength-text {
            margin-top: 5px;
            font-size: 12px;
        }
        .password-requirements {
            text-align: left;
            font-size: 12px;
            color: #666;
            margin-top: 5px;
            margin-bottom: 15px;
        }
        .requirement {
            display: flex;
            align-items: center;
            margin-top: 3px;
        }
        .requirement i {
            margin-right: 5px;
            font-size: 10px;
        }
        .requirement.valid i {
            color: green;
        }
        .requirement.invalid i {
            color: #999;
        }
    `;
    document.head.appendChild(style);
    
    // Crear lista de requisitos
    const requirementsList = document.createElement('div');
    requirementsList.className = 'password-requirements';
    requirementsList.innerHTML = `
        <div class="requirement" id="req-length"><i class="fa fa-circle"></i> Al menos 8 caracteres</div>
        <div class="requirement" id="req-uppercase"><i class="fa fa-circle"></i> Al menos una mayúscula</div>
        <div class="requirement" id="req-lowercase"><i class="fa fa-circle"></i> Al menos una minúscula</div>
        <div class="requirement" id="req-number"><i class="fa fa-circle"></i> Al menos un número</div>
        <div class="requirement" id="req-special"><i class="fa fa-circle"></i> Al menos un carácter especial</div>
    `;
    
    // Insertar después del indicador de fortaleza
    strengthIndicator.insertAdjacentElement('afterend', requirementsList);
    
    // Configurar visibilidad de contraseña
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordField = this.previousElementSibling;
            const icon = this.querySelector('i');
            
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                passwordField.type = 'password';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
    });
    
    // Validar fortaleza de contraseña mientras el usuario escribe
    newPasswordInput.addEventListener('input', function() {
        const password = this.value;
        validatePassword(password);
    });
    
    // Función para validar contraseña
    function validatePassword(password) {
        // Verificar requisitos
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        };
        
        // Actualizar visualización de requisitos
        document.getElementById('req-length').className = 'requirement ' + (requirements.length ? 'valid' : 'invalid');
        document.getElementById('req-uppercase').className = 'requirement ' + (requirements.uppercase ? 'valid' : 'invalid');
        document.getElementById('req-lowercase').className = 'requirement ' + (requirements.lowercase ? 'valid' : 'invalid');
        document.getElementById('req-number').className = 'requirement ' + (requirements.number ? 'valid' : 'invalid');
        document.getElementById('req-special').className = 'requirement ' + (requirements.special ? 'valid' : 'invalid');
        
        // Cambiar íconos
        document.querySelectorAll('.requirement.valid i').forEach(icon => {
            icon.className = 'fa fa-check-circle';
        });
        document.querySelectorAll('.requirement.invalid i').forEach(icon => {
            icon.className = 'fa fa-circle';
        });
        
        // Calcular fortaleza (0-4)
        const meetsCount = Object.values(requirements).filter(Boolean).length;
        
        // Actualizar barra de fortaleza
        const strengthMeter = document.querySelector('.strength-meter-fill');
        const strengthText = document.querySelector('.strength-text');
        
        strengthMeter.style.width = (meetsCount * 20) + '%';
        
        let strengthLabel = '';
        let strengthColor = '';
        
        if (password.length === 0) {
            strengthLabel = '';
            strengthColor = '#ddd';
        } else if (meetsCount <= 2) {
            strengthLabel = 'Débil';
            strengthColor = '#ff4d4d';
        } else if (meetsCount === 3) {
            strengthLabel = 'Media';
            strengthColor = '#ffa64d';
        } else if (meetsCount === 4) {
            strengthLabel = 'Buena';
            strengthColor = '#2bd965';
        } else if (meetsCount === 5) {
            strengthLabel = 'Fuerte';
            strengthColor = '#22c25e';
        }
        
        strengthMeter.style.backgroundColor = strengthColor;
        strengthText.textContent = strengthLabel;
        strengthText.style.color = strengthColor;
        
        return meetsCount === 5; // Devuelve true si cumple todos los requisitos
    }
    
    // Manejar el envío del formulario
    resetForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Obtener datos del formulario
        const formData = new FormData(resetForm);
        const email = formData.get('email').trim();
        const identification = formData.get('identification').trim();
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');
        
        // Validaciones básicas
        if (!email || !identification || !newPassword || !confirmPassword) {
            mostrarError('Todos los campos son obligatorios.');
            return;
        }
        
        // Validar fortaleza de contraseña
        if (!validatePassword(newPassword)) {
            mostrarError('La contraseña no cumple con todos los requisitos de seguridad.');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            mostrarError('Las contraseñas no coinciden.');
            return;
        }
        
        try {
            const response = await fetch('http://localhost:3001/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    identification,
                    newPassword,
                    confirmPassword
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Error al restablecer la contraseña');
            }
            
            // Mostrar mensaje de éxito
            mostrarMensaje('Contraseña actualizada correctamente.', 'green');
            
            // Redirigir después de un breve retraso
            setTimeout(() => {
                window.location.href = '/frontend/register.html';
            }, 2000);
            
        } catch (error) {
            mostrarError(error.message);
        }
    });
    
    // Funciones auxiliares
    function mostrarError(mensaje) {
        resetError.textContent = mensaje;
        resetError.style.color = 'red';
        resetError.classList.remove('hidden');
    }
    
    function mostrarMensaje(mensaje, color) {
        resetError.textContent = mensaje;
        resetError.style.color = color;
        resetError.classList.remove('hidden');
    }
});