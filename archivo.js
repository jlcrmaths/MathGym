∫document.addEventListener('DOMContentLoaded', () => {
    const contenedor = document.getElementById('lista-archivo');
    
    fetch('lista_retos.json')
        .then(response => {
            if (!response.ok) { throw new Error('No se pudo cargar la lista de retos.'); }
            return response.json();
        })
        .then(retos => {
            if (!retos || retos.length === 0) {
                contenedor.innerHTML = '<p>Aún no hay retos en el archivo.</p>';
                return;
            }
            
            const listaHTML = retos.map(reto => `
                <div class="item-archivo">
                    <span>${reto.fecha}</span>
                    <span>${reto.titulo}</span>
                </div>
            `).join('');
            
            contenedor.innerHTML = listaHTML;
        })
        .catch(error => {
            contenedor.innerHTML = '<p>El archivo de retos está vacío o no se ha generado aún.</p>';
            console.error(error);
        });
});