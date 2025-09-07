document.addEventListener('DOMContentLoaded', () => {
    const contenedor = document.getElementById('lista-preproduccion');

    fetch('lista_retos.json')
        .then(response => {
            if (!response.ok) { throw new Error('No se pudo cargar la lista de retos.'); }
            return response.json();
        })
        .then(retos => {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            const retosFuturos = retos.filter(reto => new Date(reto.fecha) > hoy)
                                      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

            if (retosFuturos.length === 0) {
                contenedor.innerHTML = '<div class="item-archivo"><p>No hay retos futuros programados.</p></div>';
                return;
            }

            const listaHTML = retosFuturos.map(reto => `
                <div class="item-archivo">
                    <span>${reto.fecha}</span>
                    <span>${reto.titulo}</span>
                    <button class="boton-regenerar" data-fecha="${reto.fecha}">Regenerar 🔄</button>
                </div>
            `).join('');
            contenedor.innerHTML = listaHTML;

            document.querySelectorAll('.boton-regenerar').forEach(boton => {
                boton.addEventListener('click', () => {
                    const fecha = boton.dataset.fecha;
                    if (confirm(`¿Seguro que quieres borrar y regenerar el reto del día ${fecha}?`)) {
                        regenerarReto(fecha, boton);
                    }
                });
            });
        })
        .catch(error => {
            contenedor.innerHTML = '<div class="item-archivo"><p>El archivo de retos está vacío o no se ha generado aún.</p></div>';
            console.error(error);
        });
});

function regenerarReto(fecha, boton) {
    boton.disabled = true;
    boton.textContent = 'Regenerando...';

    const GITHUB_PAT = localStorage.getItem('GITHUB_PAT');
    if (!GITHUB_PAT) {
        const token = prompt("Para regenerar, pega tu GitHub Personal Access Token aquí (se guardará en tu navegador para futuras regeneraciones):");
        if (token) {
            localStorage.setItem('GITHUB_PAT', token);
            regenerarReto(fecha, boton); // Volver a intentar
        } else {
            boton.disabled = false;
            boton.textContent = 'Regenerar 🔄';
        }
        return;
    }
    
    // ⬇️ ¡IMPORTANTE! CAMBIA ESTO A TU USUARIO Y NOMBRE DE REPOSITORIO ⬇️
    const REPO_URL = "tu_usuario/tu_repositorio"; 

    fetch(`https://api.github.com/repos/${REPO_URL}/actions/workflows/generate-future-challenge.yml/dispatches`, {
        method: 'POST',
        headers: {
            'Authorization': `token ${GITHUB_PAT}`,
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
            ref: 'develop',
            inputs: {
                fecha_regenerar: fecha
            }
        })
    })
    .then(response => {
        if (response.status === 204) {
            alert(`✅ ¡Orden de regeneración enviada para el reto del ${fecha}! La web se actualizará en unos minutos.`);
            boton.textContent = '¡Orden Enviada!';
        } else {
            alert('❌ Error al enviar la orden. Revisa la consola para más detalles.');
            boton.disabled = false;
            boton.textContent = 'Regenerar 🔄';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Hubo un error de red. Revisa la consola.');
        boton.disabled = false;
        boton.textContent = 'Regenerar 🔄';
    });
}