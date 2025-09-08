(() => {
  'use strict';

  // Firebase config (opcional)
  const firebaseConfig = {
    apiKey: "AIzaSyCIYzZ4S727l07HBuHjNnKqFOY297esMGQ",
    authDomain: "mathgym-23.firebaseapp.com",
    projectId: "mathgym-23",
    storageBucket: "mathgym-23.appspot.com",
    messagingSenderId: "952122904876",
    appId: "1:952122904876:web:bf7ef258636c30fc3c5c89"
  };

  let db = null;
  try {
    if (typeof firebase !== 'undefined') {
      if (!firebase.apps || firebase.apps.length === 0) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.firestore();
    }
  } catch (e) {
    console.warn("Firebase no disponible:", e?.message || e);
  }

  // Frases dinámicas por estado
  const frases = {
    feliz: [
      "¡Vamos a por todas!",
      "Hoy te veo con energía.",
      "Este reto es pan comido para ti.",
      "¡A por el reto del día!",
      "¡Este te va a gustar!"
    ],
    pensando: [
      "Mmm… este reto tiene truco.",
      "Piensa bien cada paso.",
      "No te precipites, analiza.",
      "Este es del archivo, ¡revívelo!",
      "¿Recuerdas cómo lo resolviste?"
    ],
    sorprendido: [
      "¡Vaya jugada!",
      "No me lo esperaba.",
      "¡Eso sí que es nivel!",
      "¡Gracias por tu voto!",
      "¡Qué crack!"
    ]
  };

  // Función para que Deceerre hable
  function deceerreHabla(mensaje = null, estado = "feliz") {
    const bubble = document.getElementById("deceerre-bubble");
    const img = document.getElementById("deceerre-img");
    if (!bubble || !img) return;

    const texto = mensaje || frases[estado][Math.floor(Math.random() * frases[estado].length)];
    bubble.innerHTML = `<strong>¡Vamos!</strong><span>${texto}</span>`;

    const estados = {
      feliz: "assets/deceerre-feliz.png",
      pensando: "assets/deceerre-pensando.png",
      sorprendido: "assets/deceerre-sorprendido.png"
    };
    img.src = estados[estado] || estados.feliz;

    img.classList.add("animar");
    setTimeout(() => img.classList.remove("animar"), 400);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const $ = (id) => document.getElementById(id);
    const el = {
      titulo: $('titulo-reto'),
      objetivo: $('objetivo-reto'),
      imagen: $('imagen-reto'),
      visitas: $('contador-visitas'),
      rating: $('valoracion-reto'),
      sistemaValoracion: $('sistema-valoracion'),
      estrellas: document.querySelectorAll('.estrellas span'),
      shareX: $('share-twitter'),
      shareWa: $('share-whatsapp'),
    };

    let retoActualId = '';
    let retoTitulo = '';
    let votoBloqueado = false;
    let valorSeleccionado = 0;

    const params = new URLSearchParams(window.location.search);
    const fechaParam = params.get('fecha');
    const ruta = fechaParam ? `retos/${encodeURIComponent(fechaParam)}.json` : 'reto.json';

    // Mensaje inicial de Deceerre
    deceerreHabla(null, fechaParam ? "pensando" : "feliz");

    fetch(ruta, { cache: 'no-cache' })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then(reto => {
        if (!reto || !reto.fecha) {
          el.titulo.textContent = "Esperando el próximo reto...";
          el.objetivo.textContent = "";
          deceerreHabla("Aún no hay reto disponible. Vuelve pronto.", "pensando");
          return;
        }

        retoActualId = String(reto.fecha);
        retoTitulo = String(reto.titulo || 'Reto del día');

        actualizarUI(reto);
        deceerreHabla(reto.objetivo, fechaParam ? "pensando" : "feliz");
        actualizarBotonesCompartir(retoTitulo);

        if (db) {
          conectarFirebase(retoActualId);
          prepararValoracion(retoActualId);
        } else {
          el.visitas.textContent = '👁️ --';
          el.rating.textContent = '⭐ --/5';
        }
      })
      .catch(err => {
        console