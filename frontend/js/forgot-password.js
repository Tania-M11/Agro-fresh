document.addEventListener('DOMContentLoaded', () => {
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const messageElement = document.querySelector('.message');
  
    forgotPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = forgotPasswordForm.email.value.trim();
  
      if (!email) {
        showMessage('Por favor ingresa tu correo electrónico.', 'error');
        return;
      }
  
      try {
        // Mostrar mensaje de espera
        showMessage('Enviando enlace de recuperación...', 'info');
  
        const response = await fetch('http://localhost:5001/api/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.message || 'Error al procesar la solicitud');
        }
  
        // Mostrar mensaje de éxito
        showMessage(data.message || 'Se ha enviado un enlace a tu correo electrónico. Por favor revisa tu bandeja de entrada.', 'success');
        forgotPasswordForm.reset();
      } catch (error) {
        showMessage(error.message || 'No se pudo procesar la solicitud. Intenta nuevamente.', 'error');
      }
    });
  
    function showMessage(text, type) {
      messageElement.textContent = text;
      messageElement.className = 'message';
      
      // Añadir clase según el tipo de mensaje
      if (type === 'error') {
        messageElement.classList.add('error');
        messageElement.style.color = 'red';
      } else if (type === 'success') {
        messageElement.classList.add('success');
        messageElement.style.color = 'green';
      } else {
        messageElement.classList.add('info');
        messageElement.style.color = 'blue';
      }
      
      messageElement.classList.remove('hidden');
    }
  });