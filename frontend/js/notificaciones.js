// notificaciones.js
document.addEventListener('DOMContentLoaded', function() {
   // Depuración: Comprueba si hay token
   const token = localStorage.getItem('token');
   console.log("Token almacenado:", token ? "Presente" : "Ausente");
   
   if (!token) {
       // Si no hay token, muestra mensaje y redirecciona después de 3 segundos
       document.getElementById('notifications-container').innerHTML = '<p class="error">No has iniciado sesión. Por favor, inicia sesión para ver tus notificaciones.</p>';
       setTimeout(() => {
           window.location.href = '/frontend/register.html'; // Ajusta esta ruta a tu página de login
       }, 3000);
       return;
   }
   
    loadNotifications();
    
    // Actualizar cada 5 minutos (300000 ms)
    setInterval(loadNotifications, 300000);
  });
  
  async function loadNotifications() {
    const container = document.getElementById('notifications-container');
    
    if (!container) return;
    
    try {
      // Mostrar mensaje de carga
      container.innerHTML = '<p class="loading">Cargando notificaciones...</p>';
      
      const token = localStorage.getItem('token');
      if (!token) {
        container.innerHTML = '<p class="error">No has iniciado sesión. Por favor, inicia sesión para ver tus notificaciones.</p>';
        return;
      }
      
      const response = await fetch('http://localhost:3001/api/notifications', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar notificaciones');
      }
      
      const notifications = await response.json();
      displayNotifications(notifications);
      updateNotificationCounter(notifications);
    } catch (error) {
      console.error('Error:', error);
      container.innerHTML = `<p class="error">Error al cargar notificaciones: ${error.message}</p>`;
    }
  }
  
  function displayNotifications(notifications) {
    const container = document.getElementById('notifications-container');
    
    if (!container) return;
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    if (notifications.length === 0) {
      container.innerHTML = '<p class="no-notifications">No tienes notificaciones</p>';
      return;
    }
    
    // Crear contenedor de lista
    const notificationsList = document.createElement('div');
    notificationsList.className = 'notifications-list';
    container.appendChild(notificationsList);
    
    // Crear elemento para cada notificación
    notifications.forEach(notification => {
      const notificationElement = document.createElement('div');
      notificationElement.className = `notification ${notification.status} ${notification.isRead ? 'read' : 'unread'}`;
      notificationElement.dataset.id = notification._id;
      
      notificationElement.innerHTML = `
        <div class="notification-content">
          <p class="notification-message">${notification.message}</p>
          <span class="notification-date">${formatDate(notification.createdAt)}</span>
        </div>
        <div class="notification-actions">
          <button class="mark-read-btn ${notification.isRead ? 'hidden' : ''}">Marcar como leída</button>
          <button class="delete-btn">Eliminar</button>
        </div>
      `;
      
      // Añadir evento para marcar como leída
      const markReadBtn = notificationElement.querySelector('.mark-read-btn');
      if (markReadBtn) {
        markReadBtn.addEventListener('click', () => markNotificationAsRead(notification._id));
      }
      
      // Añadir evento para eliminar
      const deleteBtn = notificationElement.querySelector('.delete-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => deleteNotification(notification._id));
      }
      
      notificationsList.appendChild(notificationElement);
    });
    
    // Añadir botón para marcar todas como leídas si hay notificaciones no leídas
    const hasUnread = notifications.some(notif => !notif.isRead);
    if (hasUnread) {
      const markAllBtn = document.createElement('button');
      markAllBtn.className = 'mark-all-btn';
      markAllBtn.textContent = 'Marcar todas como leídas';
      markAllBtn.addEventListener('click', markAllAsRead);
      container.appendChild(markAllBtn);
    }
  }
  
  function updateNotificationCounter(notifications) {
    const unreadCount = notifications.filter(notif => !notif.isRead).length;
    
    // Actualizar contador en el icono de notificaciones en todas las páginas
    document.querySelectorAll('.notification-counter').forEach(counter => {
      if (unreadCount > 0) {
        counter.textContent = unreadCount;
        counter.classList.remove('hidden');
      } else {
        counter.classList.add('hidden');
      }
    });
  }
  
  async function markNotificationAsRead(id) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`http://localhost:3001/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al actualizar notificación');
      }
      
      // Actualizar UI localmente sin recargar todas las notificaciones
      const notificationElement = document.querySelector(`.notification[data-id="${id}"]`);
      if (notificationElement) {
        notificationElement.classList.remove('unread');
        notificationElement.classList.add('read');
        const markReadBtn = notificationElement.querySelector('.mark-read-btn');
        if (markReadBtn) markReadBtn.classList.add('hidden');
      }
      
      // Recargar contador
      const allNotifications = document.querySelectorAll('.notification');
      const unreadCount = [...allNotifications].filter(el => el.classList.contains('unread')).length;
      updateNotificationCounterValue(unreadCount);
      
    } catch (error) {
      console.error('Error:', error);
      alert('Error al marcar como leída: ' + error.message);
    }
  }
  
  function updateNotificationCounterValue(count) {
    document.querySelectorAll('.notification-counter').forEach(counter => {
      if (count > 0) {
        counter.textContent = count;
        counter.classList.remove('hidden');
      } else {
        counter.classList.add('hidden');
      }
    });
  }
  
  async function deleteNotification(id) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`http://localhost:3001/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar notificación');
      }
      
      // Eliminar elemento del DOM
      const element = document.querySelector(`.notification[data-id="${id}"]`);
      if (element) {
        // Verificar si era no leída para actualizar contador
        const wasUnread = element.classList.contains('unread');
        element.remove();
        
        // Actualizar contador si era no leída
        if (wasUnread) {
          const remainingUnread = document.querySelectorAll('.notification.unread').length;
          updateNotificationCounterValue(remainingUnread);
        }
        
        // Si no quedan notificaciones, mostrar mensaje
        const remainingNotifications = document.querySelectorAll('.notification').length;
        if (remainingNotifications === 0) {
          document.querySelector('.notifications-list').innerHTML = 
            '<p class="no-notifications">No tienes notificaciones</p>';
          
          // Eliminar el botón "marcar todas"
          const markAllBtn = document.querySelector('.mark-all-btn');
          if (markAllBtn) markAllBtn.remove();
        }
      }
      
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar notificación: ' + error.message);
    }
  }
  
  async function markAllAsRead() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('http://localhost:3001/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al actualizar notificaciones');
      }
      
      // Actualizar UI
      document.querySelectorAll('.notification').forEach(el => {
        el.classList.remove('unread');
        el.classList.add('read');
        const markReadBtn = el.querySelector('.mark-read-btn');
        if (markReadBtn) markReadBtn.classList.add('hidden');
      });
      
      // Ocultar contador de notificaciones
      updateNotificationCounterValue(0);
      
      // Ocultar botón de marcar todas
      const markAllBtn = document.querySelector('.mark-all-btn');
      if (markAllBtn) markAllBtn.remove();
      
    } catch (error) {
      console.error('Error:', error);
      alert('Error al marcar todas como leídas: ' + error.message);
    }
  }
  
  function formatDate(dateString) {
    const date = new Date(dateString);
    
    // Comprobar si la fecha es hoy
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return `Hoy, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Comprobar si la fecha es ayer
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Ayer, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Para otras fechas
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }