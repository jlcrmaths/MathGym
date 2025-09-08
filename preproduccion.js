document.addEventListener("DOMContentLoaded", () => {
    const contenedor = document.getElementById("lista-pendientes");
    const botonExportar = document.getElementById("exportar-json");
    const ruta = "lista_pendientes.json";
    const decisiones = [];
  
    fetch(ruta)
      .then(r => r.ok ? r.json() : Promise.reject(new Error("No se pudo cargar lista_pendientes.json")))
      .then(lista => {
        if (!Array.isArray(lista) || lista.length === 0) {
          contenedor.innerHTML = "<p>No hay retos pendientes.</p>";
          return;
        }
  
        const fragmento = document.createDocumentFragment();
  
        lista.forEach(reto => {
          const bloque = document.createElement("div");
          bloque.className = "bloque-reto";
          bloque.style.border = "1px solid #ccc";
          bloque.style.borderRadius = "8px";
          bloque.style.padding = "12px";
          bloque.style.marginBottom = "12px";
          bloque.style.background = "#fff";
  
          const titulo = document.createElement("h3");
          titulo.textContent = `${reto.fecha} — ${reto.titulo}`;
          bloque.appendChild(titulo);
  
          const botones = document.createElement("div");
          botones.style.display = "flex";
          botones.style.gap = "10px";
  
          const aprobar = document.createElement("button");
          aprobar.textContent = "✅ Aprobar";
          aprobar.style.background = "#2ecc71";
          aprobar.style.color = "#fff";
          aprobar.style.border = "none";
          aprobar.style.padding = "6px 12px";
          aprobar.style.borderRadius = "6px";
          aprobar.style.cursor = "pointer";
  
          const rechazar = document.createElement("button");
          rechazar.textContent = "❌ Rechazar";
          rechazar.style.background = "#e74c3c";
          rechazar.style.color = "#fff";
          rechazar.style.border = "none";
          rechazar.style.padding = "6px 12px";
          rechazar.style.borderRadius = "6px";
          rechazar.style.cursor = "pointer";
  
          aprobar.addEventListener("click", () => {
            decisiones.push({ fecha: reto.fecha, estado: "aprobado" });
            bloquearBotones(aprobar, rechazar);
          });
  
          rechazar.addEventListener("click", () => {
            decisiones.push({ fecha: reto.fecha, estado: "rechazado" });
            bloquearBotones(aprobar, rechazar);
          });
  
          botones.appendChild(aprobar);
          botones.appendChild(rechazar);
          bloque.appendChild(botones);
          fragmento.appendChild(bloque);
        });
  
        contenedor.innerHTML = "";
        contenedor.appendChild(fragmento);
      })
      .catch(err => {
        console.error("Error al cargar retos pendientes:", err);
        contenedor.innerHTML = "<p>Error al cargar los retos pendientes.</p>";
      });
  
    botonExportar.addEventListener("click", () => {
      if (decisiones.length === 0) {
        alert("No has tomado ninguna decisión todavía.");
        return;
      }
  
      const blob = new Blob([JSON.stringify(decisiones, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = "decisiones_preprod.json";
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      URL.revokeObjectURL(url);
    });
  
    function bloquearBotones(...botones) {
      botones.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = "0.6";
        btn.style.cursor = "default";
      });
    }
  });
  