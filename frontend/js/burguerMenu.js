
        document.addEventListener('DOMContentLoaded', function() {
            const $menu = document.getElementById('menu');
            const $navigation = document.querySelector('.navigation');
            const $body = document.body;
            
            // Función para abrir el menú
            const openMenu = () => {
                $navigation.classList.remove("hidden");
                closeButton(); // Solo se quiere que se dibuje el botón cuando se abra el menú
            };
            
            // Creando el botón de cerrar
            const closeButton = () => {
                const btnClose = document.createElement("p");
                const overlay = document.createElement("div");
                overlay.classList.add("full-screen");
                
                // Con qsALL se crea una colección de datos, un arreglo, tiene todos los overlay creados por el user
                // Si los div creados es > 0 termine ya ejecución del programa
                if (document.querySelectorAll(".full-screen").length > 0) return;
                
                // Inyectar el overlay al body
                $body.appendChild(overlay);
                
                btnClose.textContent = "X";
                btnClose.classList.add("btn-close");
                // Agregar la x con los estilos al html
                
                // Para agregar el botón de cerrar al menú
                $navigation.appendChild(btnClose);
                closeMenu(btnClose, overlay);
            };
            
            // Para quitar el menú
            const closeMenu = (button, overlay) => {
                button.addEventListener("click", () => {
                    $navigation.classList.add("hidden");
                    // Para que el overlay no se cree una y otra vez una vez se presiona el botón, se quita el overlay
                    overlay.remove();
                    // Para que no se genere una div de botón por cada click --->
                    button.remove();
                });
                
                // Para cuando el overlay esté activo, al presionar en la pantalla se debe quitar
                overlay.onclick = function () {
                    overlay.remove();
                    $navigation.classList.add("hidden");
                    //-->
                    button.remove();
                };
            };
            
            // Nueva función para cerrar el menú al hacer clic en un enlace
            const closeMenuHandler = () => {
                $navigation.classList.add("hidden");
                const overlay = document.querySelector(".full-screen");
                const closeButton = document.querySelector(".btn-close");
                
                // Elimina el overlay y el botón de cerrar si existen
                if (overlay) overlay.remove();
                if (closeButton) closeButton.remove();
            };
            
            // Manejo del menú con los links
            const events = () => {
                $menu.addEventListener("click", openMenu);
                
                // Detectar clics en los enlaces del menú
                const $menuLinks = document.querySelectorAll(".navigation a"); // Selecciona los enlaces del menú
                $menuLinks.forEach((link) => {
                    link.addEventListener("click", () => {
                        closeMenuHandler(); // Llama a la función que cierra el menú
                    });
                });
            };
            
            // Iniciar los eventos
            events();
        });
  