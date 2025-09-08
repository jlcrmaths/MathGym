import google.generativeai as genai
import json
import os
<<<<<<< HEAD
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import credentials

# --- CONFIGURACIÓN ---
# Configuración de la API de Gemini
api_key = os.environ.get("GEMINI_API_KEY")
genai.configure(api_key=api_key)

# El modelo de IA que usaremos (¡AQUÍ ESTÁ LA CORRECCIÓN!)
model = genai.GenerativeModel('gemini-1.5-flash-latest')

# Configuración de Firebase (si la usas para algo en este script)
# creds_json = os.environ.get("FIREBASE_CREDS")
# creds_dict = json.loads(creds_json)
# cred = credentials.Certificate(creds_dict)
# firebase_admin.initialize_app(cred)

HORARIO = {
    0: "lógica deductiva", 
    1: "laboratorio virtual de trasvases", 
    2: "criptoaritmética", 
    3: "secuencia lógica para cruzar un río", 
    4: "lógica lateral"
}

def generar_un_reto(categoria, ruta_guardado):
    """Genera un único reto y lo guarda en la ruta especificada."""
    print(f"Generando para: {categoria}...")
    # Prompt ajustado para pedir una estructura más completa
=======
from datetime import datetime

# Importamos la configuración local en lugar de leer secretos de GitHub
try:
    import config
except ImportError:
    print("❌ ERROR: No se encontró el archivo 'config.py'.")
    print("Por favor, crea un archivo config.py y añade tu GEMINI_API_KEY dentro.")
    exit()

# --- CONFIGURACIÓN ---
# Configuración de la API de Gemini desde el archivo local
api_key = config.GEMINI_API_KEY
genai.configure(api_key=api_key)

# El modelo de IA que usaremos
model = genai.GenerativeModel('gemini-1.5-flash-latest')

# Lista de categorías de retos que queremos generar
CATEGORIAS = [
    "lógica deductiva", 
    "laboratorio virtual de trasvases", 
    "criptoaritmética", 
    "secuencia lógica para cruzar un río", 
    "lógica lateral"
]

def generar_un_reto(categoria, ruta_guardado):
    """Genera un único reto y lo guarda en la ruta especificada."""
    print(f"Generando para: {categoria}...")
>>>>>>> fe17e2c (🔄 Actualización completa del sistema MathGym: reto diario, histórico, preproducción y workflows)
    prompt = f"""
    Crea un reto original de '{categoria}'.
    Devuelve EXCLUSIVAMENTE un objeto JSON válido con la siguiente estructura:
    {{
      "titulo": "Un título corto y atractivo para el reto",
      "categoria": "{categoria}",
      "enunciado": "La descripción completa y detallada del problema a resolver. Usa saltos de línea con \\n si es necesario.",
      "objetivo": "Una frase clara que describa lo que el usuario debe conseguir. Por ejemplo: 'Encuentra el valor de cada letra.' o 'Determina el orden correcto para cruzar el río.'",
      "elementos_interactivos": {{
        "tipo": "texto_libre",
        "placeholder": "Escribe tu respuesta aquí..."
      }},
      "solucion": "La respuesta correcta y una breve explicación del razonamiento para llegar a ella."
    }}
    """
    
    try:
        response = model.generate_content(prompt)
<<<<<<< HEAD
        # Limpieza robusta del texto para asegurar que sea un JSON válido
        cleaned_text = response.text.strip().replace("```json", "").replace("```", "")
        reto_json = json.loads(cleaned_text)
        
        # Crear directorio si no existe
=======
        cleaned_text = response.text.strip().replace("```json", "").replace("```", "")
        reto_json = json.loads(cleaned_text)
        
>>>>>>> fe17e2c (🔄 Actualización completa del sistema MathGym: reto diario, histórico, preproducción y workflows)
        os.makedirs(os.path.dirname(ruta_guardado), exist_ok=True)
        
        with open(ruta_guardado, "w", encoding="utf-8") as f:
            json.dump(reto_json, f, ensure_ascii=False, indent=2)
        print(f"✅ Reto para '{categoria}' guardado en {ruta_guardado}")
        return True
    except Exception as e:
        print(f"❌ ERROR en '{categoria}': {e}")
        return False

<<<<<<< HEAD
def modo_lote():
    """Modo para generar múltiples retos y guardarlos en el almacén."""
    print("Iniciando generación de lote...")
    count = int(os.environ.get('COUNT_PER_CATEGORY', 5))
    
    for categoria_nombre in HORARIO.values():
        nombre_carpeta = categoria_nombre.replace(" ", "_").lower()
        
        for i in range(1, count + 1):
            ruta = f"almacen_retos/{nombre_carpeta}/reto_{i}.json"
            generar_un_reto(categoria_nombre, ruta)
            
    print("🎉 Proceso finalizado.")

if __name__ == "__main__":
    mode = os.environ.get('GENERATION_MODE')

    if mode == 'bulk':
        modo_lote()
    else:
        print("Modo no especificado. El script debe ejecutarse en modo 'bulk'.")
=======
def generar_lote():
    """Genera múltiples retos y los guarda en el almacén."""
    print("Iniciando generación de lote...")
    # Puedes cambiar este número si quieres más o menos retos por categoría
    retos_por_categoria = 5 
    
    for categoria_nombre in CATEGORIAS:
        nombre_carpeta = categoria_nombre.replace(" ", "_").lower()
        
        for i in range(1, retos_por_categoria + 1):
            # Usamos una marca de tiempo para asegurar nombres de archivo únicos
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            ruta = f"almacen_retos/{nombre_carpeta}/reto_{timestamp}_{i}.json"
            generar_un_reto(categoria_nombre, ruta)
            
    print("\n🎉 Proceso finalizado. La carpeta 'almacen_retos' está lista para ser subida a GitHub.")

if __name__ == "__main__":
    generar_lote()
>>>>>>> fe17e2c (🔄 Actualización completa del sistema MathGym: reto diario, histórico, preproducción y workflows)
