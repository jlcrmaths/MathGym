// --- CONFIGURACIÓN DE FIREBASE ---
// ¡IMPORTANTE! PEGA AQUÍ LA CONFIGURACIÓN DE TU PROYECTO FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyCIYzZ4S727l07HBuHjNnKqFOY297esMGQ",
    authDomain: "mathgym-23.firebaseapp.com",
    projectId: "mathgym-23",
    storageBucket: "mathgym-23.firebasestorage.app",
    messagingSenderId: "952122904876",
    appId: "1:952122904876:web:bf7ef258636c30fc3c5c89"
  };
  
  // --- INICIALIZACIÓN ---
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  
  // --- LÓGICA DE LA APLICACIÓN ---
  document.addEventListener('DOMContentLoaded', () => {
      let retoActualId = '';
      let retoTitulo = '';
  
      fetch('reto.json')
          .then(response => response.json())
          .then(reto => {
              if (!reto || !reto.fecha) {
                  document.getElementById('titulo-reto').textContent = "Esperando el próximo reto...";
                  return;
              }
              retoActualId = reto.fecha;
              retoTitulo = reto.titulo;
              actualizarUI(reto);
              conectarARetoEnFirebase(retoActualId);
              actualizarBotonesCompartir(retoTitulo);
          })
          .catch(error => {
              console.error("Error al cargar reto local:", error);
              document.getElementById('titulo-reto').textContent = "No se pudo cargar el reto de hoy.";
          });
  
      function actualizarUI(reto) {
          document.getElementById('titulo-reto').textContent = reto.titulo;
          document.getElementById('objetivo-reto').textContent = reto.objetivo;
          document.getElementById('imagen-reto').src = reto.icono_url;
      }
  
      function actualizarBotonesCompartir(titulo) {
          const url = window.location.href;
          const textoTwitter = encodeURIComponent(`🧠 ¡Nuevo reto en Cortex Diario! "${titulo}". ¿Puedes resolverlo? ${url}`);
          const textoWhatsapp = encodeURIComponent(`🧠 ¡Nuevo reto en Cortex Diario! "${titulo}". ¿Puedes resolverlo? Visita la web: ${url}`);
          
          document.getElementById('share-twitter').href = `https://twitter.com/intent/tweet?text=${textoTwitter}`;
          document.getElementById('share-whatsapp').href = `https://api.whatsapp.com/send?text=${textoWhatsapp}`;
      }
  
      function conectarARetoEnFirebase(id) {
          const retoRef = db.collection('retos').doc(id);
          
          const visitado = sessionStorage.getItem(`visitado-${id}`);
          if (!visitado) {
              retoRef.set({ visitas: firebase.firestore.FieldValue.increment(1) }, { merge: true })
                     .catch(() => console.log("Se creará el doc en Firebase."));
              sessionStorage.setItem(`visitado-${id}`, 'true');
          }
  
          retoRef.onSnapshot((doc) => {
              if (doc.exists) {
                  const data = doc.data();
                  const media = data.numero_votos > 0 ? (data.suma_valoraciones / data.numero_votos).toFixed(1) : 'N/A';
                  document.getElementById('contador-visitas').textContent = `👁️ ${data.visitas || 0}`;
                  document.getElementById('valoracion-reto').textContent = `⭐ ${media}/5`;
              } else {
                   document.getElementById('contador-visitas').textContent = `👁️ 0`;
                   document.getElementById('valoracion-reto').textContent = `⭐ N/A`;
              }
          });
      }
  
      const votado = localStorage.getItem(`votado-${new Date().toISOString().split('T')[0]}`);
      if (votado) {
          document.getElementById('sistema-valoracion').innerHTML = '<p>¡Gracias por tu voto de hoy!</p>';
      } else {
          document.querySelectorAll('.estrellas span').forEach(estrella => {
              estrella.addEventListener('click', () => {
                  if (!retoActualId) return;
                  const valor = parseInt(estrella.dataset.valor);
                  const retoRef = db.collection('retos').doc(retoActualId);
                  retoRef.set({
                      suma_valoraciones: firebase.firestore.FieldValue.increment(valor),
                      numero_votos: firebase.firestore.FieldValue.increment(1)
                  }, { merge: true });
                  localStorage.setItem(`votado-${retoActualId}`, 'true');
                  document.getElementById('sistema-valoracion').innerHTML = '<p>¡Gracias por tu voto!</p>';
              });
          });
      }
  });