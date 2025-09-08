document.addEventListener("DOMContentLoaded", () => {
    const contenedor = document.getElementById("lista-retos");
    const ruta = "lista_retos.json";
  
    fetch(ruta)
      .then(r => r.ok ? r.json() : Promise.reject(new Error("No se pudo cargar lista_retos.json")))
      .then(lista => {
        if (!Array.isArray(lista) || lista.length === 0) {
          contenedor.innerHTML = "<p>No hay retos publicados aún.</p>";
          return;
        }
  
        const ul = document.createElement("ul");
        lista.forEach(reto => {
          const li = document.createElement("li");
          const enlace = document.createElement("a");
          enlace.href = `index.html?fecha=${reto.fecha}`;
          enlace.textContent = `📅 ${reto.fecha} — ${reto.titulo}`;
          li.appendChild(enlace);
          ul.appendChild(li);
        });
  
        contenedor.innerHTML = "";
        contenedor.appendChild(ul);
      })
      .catch(err => {
        console.error("Error al cargar archivo:", err);
        contenedor.innerHTML = "<p>Error al cargar el archivo de retos.</p>";
      });
  });
  