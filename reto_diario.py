import google.generativeai as genai
import json
import os
from datetime import datetime
import firebase_admin
from firebase_admin import credentials

# --- CONFIGURACIÓN ---
# Intenta obtener las credenciales de Firebase desde las variables de entorno
try:
    firebase_creds_json = os.environ.get('FIREBASE_CREDS')
    if firebase_creds_json:
        creds_dict = json.loads(firebase_creds_json)
        cred = credentials.Certificate(creds_dict)
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
    else:
        print("Advertencia: Variable FIREBASE_CREDS no encontrada.")
except Exception as e:
    print(f"Advertencia: Firebase no pudo ser configurado. Error: {e}")

# Configura la API de Gemini
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-pro')
else:
    model = None
    print("Advertencia: API Key de Gemini (GEMINI_API_KEY) no encontrada.")

HORARIO = {
    0: "lógica deductiva", 
    1: "laboratorio virtual de trasvases", 
    2: "criptoaritmética", 
    3: "secuencia lógica para cruzar un río", 
    4: "lógica lateral"
}

def generar_un_reto(categoria, ruta_guardado):
    """Genera un único reto y lo guarda en la ruta especificada."""
    if not model:
        print("El modelo Gemini no está disponible. Revisa la API Key.")
        return False
        
    print(f"Generando reto para la categoría: {categoria}...")
    prompt = f"Crea un reto de lógica original sobre '{categoria}'. Devuelve EXCLUSIVAMENTE en formato JSON con la siguiente estructura: {{\"titulo\": \"...\", \"objetivo\": \"...\"}}"
    
    try:
        response = model.generate_content(prompt)
        reto_json = json.loads(response.text.replace("```json", "").replace("```", "").strip())
        
        os.makedirs(os.path.dirname(ruta_guardado), exist_ok=True)
        
        with open(ruta_guardado, "w", encoding="utf-8") as f:
            json.dump(reto_json, f, ensure_ascii=False, indent=2)
        print(f"✅ Reto guardado en {ruta_guardado}")
        return True
    except Exception as e:
        print(f"❌ Error generando un reto desde la API: {e}")
        return False

def modo_lote():
    """Modo para generar múltiples retos y guardarlos en el almacén."""
    print("Iniciando modo de generación en lote...")
    count = int(os.environ.get('COUNT_PER_CATEGORY', 5))
    
    for categoria_nombre in HORARIO.values():
        nombre_carpeta = categoria_nombre.split(' ')[0].lower()
        
        for i in range(1, count + 1):
            ruta = f"almacen_retos/{nombre_carpeta}/reto_{i}.json"
            if not os.path.exists(ruta):
                generar_un_reto(categoria_nombre, ruta)
            else:
                print(f"El archivo {ruta} ya existe, saltando.")

def modo_individual(fecha_str):
    """Modo para generar un único reto para una fecha específica."""
    print(f"Orden de regeneración recibida para la fecha: {fecha_str}")
    
    try:
        fecha_objetivo = datetime.strptime(fecha_str, '%Y-%m-%d')
        dia_semana = fecha_objetivo.weekday()

        if dia_semana not in HORARIO:
            print(f"El {fecha_str} es fin de semana. No se genera reto.")
            return

        categoria = HORARIO[dia_semana]
        ruta = f"retos/{fecha_str}.json" # Lo guardamos en la carpeta 'retos' principal
        generar_un_reto(categoria, ruta)
    except Exception as e:
        print(f"Error en el modo individual: {e}")


# --- BLOQUE PRINCIPAL DE EJECUCIÓN ---
if __name__ == "__main__":
    
    # El script decide qué hacer basándose en las variables de entorno
    mode = os.environ.get('GENERATION_MODE')
    fecha_regenerar = os.environ.get('FECHA_REGENERAR')

    if mode == 'bulk':
        modo_lote()
    elif fecha_regenerar:
        modo_individual(fecha_regenerar)
    else:
        print("No se ha especificado un modo de operación válido (GENERATION_MODE='bulk' o FECHA_REGENERAR='YYYY-MM-DD').")