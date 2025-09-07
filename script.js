/* =========================================================
   MathGym — Lógica principal
   - Carga del reto (del día o histórico ?fecha=YYYY-MM-DD)
   - Integración con Firestore (visitas y valoración)
   - Enlaces de compartir (X/Twitter y WhatsApp + Web Share API)
   ========================================================= */

   (() => {
    'use strict';
  
    /* -------- CONFIGURACIÓN DE FIREBASE --------
     * Este config es público por naturaleza en front-end.
     * (Usa el que me pasaste)
     */
    const firebaseConfig = {
      apiKey: "AIzaSyCIYzZ4S727l07HBuHjNnKqFOY297esMGQ",
      authDomain: "mathgym-23.firebaseapp.com",
      projectId: "mathgym-23",
      storageBucket: "mathgym-23.firebasestorage.app",
      messagingSenderId: "952122904876",
      appId: "1:952122904876:web:bf7ef258636c30fc3c5c89"
    };
  
    /* -------------- INICIALIZACIÓN -------------- */
    let db = null;
  
    try {
      // Compat v9 expone firebase.apps
      if (typeof firebase !== 'undefined') {
        if (!firebase.apps || firebase.apps.length === 0) {
          firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
      } else {
        console.warn('Firebase SDK no está cargado. Se mostrará la UI sin datos en vivo.');
      }
    } catch (e) {
      console.warn("Firebase ya estaba inicializado o faltan scripts:", e?.message || e);
    }
  
    /* -------------- LÓGICA APP -------------- */
    document.addEventListener('DOMContentLoaded', () => {
      // --- Helpers DOM
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
        bubble: $('coach-bubble')
      };
  
      // --- Estado
      let retoActualId = '';     // p.ej. '2025-09-07'
      let retoTitulo   = '';
      let unsubscribeSnapshot = null;
      let votoBloqueado = false;
  
      const enc = encodeURIComponent;
  
      // Determina si se pide un reto histórico por ?fecha=
      const params = new URLSearchParams(window.location.search);
      const fechaParam = params.get('fecha');
      const ruta = fechaParam ? `retos/${enc(fechaParam)}.json` : 'reto.json';
  
      // Cargar reto (del día o histórico)
      fetch(ruta, { cache: 'no-cache' })
        .then(resp => resp.ok ? resp.json() : Promise.reject(new Error('HTTP ' + resp.status)))
        .then(reto => {
          if (!reto || !reto.fecha) {
            el.titulo.textContent = "Esperando el próximo reto...";
            el.objetivo.textContent = "";
            return;
          }
  
          retoActualId = String(reto.fecha);
          retoTitulo   = String(reto.titulo || 'Reto del día');
  
          actualizarUI(reto);
          actualizarBurbujaEntrenador(reto.objetivo);
          actualizarBotonesCompartir(retoTitulo);
  
          if (db) {
            conectarARetoEnFirebase(retoActualId);
            prepararSistemaValoracion(retoActualId);
          } else {
            // Si Firestore no está disponible, mostramos valores por defecto
            el.visitas.textContent = '👁️ --';
            el.rating.textContent = '⭐ --/5';
          }
        })
        .catch(err => {
          console.error("Error al cargar reto:", err);
          el.titulo.textContent = "No se pudo cargar el reto solicitado.";
          el.objetivo.textContent = "";
          if (el.imagen) {
            el.imagen.src = '';
            el.imagen.alt = 'Icono no disponible';
          }
        });
  
      /* ------------ Actualizaciones UI ------------ */
      function actualizarUI(reto) {
        el.titulo.textContent = reto.titulo || 'Reto del día';
        el.objetivo.textContent = reto.objetivo || '';
  
        if (el.imagen) {
          el.imagen.loading = 'lazy';
          el.imagen.decoding = 'async';
          el.imagen.src = reto.icono_url || 'assets/icono-generico.svg';
          el.imagen.alt = `Icono del reto: ${reto.titulo || 'Reto del día'}`;
          // Tamaños fijos declarados en HTML/CSS para evitar CLS
        }
      }
  
      function actualizarBurbujaEntrenador(objetivo) {
        if (!el.bubble) return;
        const strong = document.createElement('strong');
        strong.textContent = '¡Vamos!';
        const span = document.createElement('span');
        span.textContent = objetivo || '¡Calienta que empezamos!';
  
        el.bubble.innerHTML = '';
        el.bubble.appendChild(strong);
        el.bubble.appendChild(span);
      }
  
      function actualizarBotonesCompartir(titulo) {
        const urlActual = window.location.href.split('#')[0];
        const url = enc(urlActual);
        const text = enc(`🧠 ¡Nuevo reto en MathGym! "${titulo}". ¿Puedes con él?`);
  
        // X (Twitter)
        if (el.shareX) el.shareX.href = `https://x.com/intent/post?text=${text}&url=${url}`;
        // WhatsApp
        if (el.shareWa) el.shareWa.href = `https://wa.me/?text=${text}%20${url}`;
  
        // Web Share API (móvil, UX nativa)
        if (navigator.share) {
          const handler = (e) => {
            e.preventDefault();
            navigator.share({ title: 'MathGym', text: `🧠 ${titulo}`, url: urlActual })
              .catch(() => window.open(e.currentTarget.href, '_blank', 'noopener'));
          };
          // Evitar registrar múltiples veces
          el.shareX?.addEventListener('click', handler, { once: true });
          el.shareWa?.addEventListener('click', handler, { once: true });
        }
      }
  
      /* ------------ Firestore: visitas y rating ------------ */
      function conectarARetoEnFirebase(id) {
        const retoRef = db.collection('retos').doc(id);
  
        // Contador de visitas: 1 por sesión/navegador
        const visitadoKey = `visitado-${id}`;
        if (!sessionStorage.getItem(visitadoKey)) {
          retoRef.set({ visitas: firebase.firestore.FieldValue.increment(1) }, { merge: true })
            .catch(err => console.warn("No se pudo incrementar visitas:", err));
          sessionStorage.setItem(visitadoKey, 'true');
        }
  
        // Cancela listeners previos por si recargaste reto histórico
        if (typeof unsubscribeSnapshot === 'function') {
          unsubscribeSnapshot();
          unsubscribeSnapshot = null;
        }
  
        // Función para adjuntar la suscripción
        const attachSnapshot = () => {
          unsubscribeSnapshot = retoRef.onSnapshot((doc) => {
            if (doc.exists) {
              const data = doc.data() || {};
              const visitas = Number(data.visitas || 0);
              const votos = Number(data.numero_votos || 0);
              const suma = Number(data.suma_valoraciones || 0);
              const media = votos > 0 ? (suma / votos) : null;
  
              el.visitas.textContent = `👁️ ${visitas}`;
              el.rating.textContent = `⭐ ${media !== null ? media.toFixed(1) : 'N/A'}/5`;
            } else {
              el.visitas.textContent = `👁️ 0`;
              el.rating.textContent = `⭐ N/A/5`;
            }
          }, (error) => {
            console.error('Error escuchando Firestore:', error);
            el.rating.textContent = '⭐ N/A/5';
          });
        };
  
        // Adjunta por primera vez
        attachSnapshot();
  
        // Gestión de visibilidad: pausa/reanuda para ahorrar recursos
        const onVisibilityChange = () => {
          if (document.hidden) {
            if (typeof unsubscribeSnapshot === 'function') {
              unsubscribeSnapshot();
              unsubscribeSnapshot = null;
            }
          } else {
            // Reanudar si no hay listener activo
            if (!unsubscribeSnapshot) attachSnapshot();
          }
        };
  
        document.addEventListener('visibilitychange', onVisibilityChange, { passive: true });
  
        window.addEventListener('beforeunload', () => {
          if (typeof unsubscribeSnapshot === 'function') {
            unsubscribeSnapshot();
          }
        }, { once: true });
      }
  
      function prepararSistemaValoracion(id) {
        const votoKey = `votado-${id}`;
        const yaVotado = localStorage.getItem(votoKey);
  
        // Accesibilidad básica en estrellas
        el.estrellas.forEach((estrella) => {
          const valor = parseInt(estrella.dataset.valor, 10);
          estrella.setAttribute('role', 'button');
          estrella.setAttribute('tabindex', '0');
          estrella.setAttribute('aria-label', `Valorar ${valor} de 5`);
          // Inicializar visual a vacío
          estrella.textContent = '☆';
        });
  
        if (yaVotado) {
          votoBloqueado = true;
          el.sistemaValoracion.innerHTML = '<p>¡Gracias por tu voto de hoy!</p>';
          el.estrellas.forEach((e) => { e.style.pointerEvents = 'none'; e.removeAttribute('tabindex'); });
          return;
        }
  
        // Pinta n estrellas rellenadas (★) y el resto vacías (☆)
        const paintStars = (n) => {
          el.estrellas.forEach((estrella) => {
            const v = parseInt(estrella.dataset.valor, 10);
            estrella.textContent = v <= n ? '★' : '☆';
          });
        };
  
        // Efecto hover
        el.estrellas.forEach((estrella) => {
          estrella.addEventListener('mouseenter', () => {
            if (!votoBloqueado) paintStars(parseInt(estrella.dataset.valor, 10));
          });
          estrella.addEventListener('mouseleave', () => {
            if (!votoBloqueado) paintStars(0);
          });
        });
  
        const votar = (valor) => {
          if (!id || !Number.isInteger(valor) || valor < 1 || valor > 5 || votoBloqueado) return;
          const retoRef = db.collection('retos').doc(id);
          retoRef.set({
            suma_valoraciones: firebase.firestore.FieldValue.increment(valor),
            numero_votos: firebase.firestore.FieldValue.increment(1)
          }, { merge: true })
            .then(() => {
              try { localStorage.setItem(votoKey, 'true'); } catch {}
              votoBloqueado = true;
              el.sistemaValoracion.innerHTML = '<p>¡Gracias por tu voto!</p>';
              paintStars(valor); // Congela el estado visual en la puntuación dada
              // Desactivar eventos para evitar más cambios
              el.estrellas.forEach((e) => {
                e.style.pointerEvents = 'none';
                e.removeAttribute('tabindex');
              });
            })
            .catch(err => {
              console.error('No se pudo registrar el voto:', err);
              el.sistemaValoracion.insertAdjacentHTML(
                'beforeend',
                '<p style="color:#e67e22">No se pudo registrar el voto. Inténtalo de nuevo.</p>'
              );
            });
        };
  
        // Click y teclado
        el.estrellas.forEach((estrella) => {
          estrella.addEventListener('click', () => votar(parseInt(estrella.dataset.valor, 10)));
          estrella.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
              ev.preventDefault();
              votar(parseInt(estrella.dataset.valor, 10));
            }
          });
        });
      }
    });
  })();
  