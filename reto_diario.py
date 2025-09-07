import google.generativeai as genai
import json
import os
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import credentials

# --- CONFIGURACIÓN ---
# (La configuración de Firebase y Gemini es la misma de antes)

# ... (pega aquí la configuración de Firebase y Gemini de la guía anterior) ...

HORARIO = {
    0: "lógica deductiva", 
    1: "laboratorio virtual de trasvases", 
    2: "criptoaritmética", 
    3: "secuencia lógica para cruzar un río", 
    4: "lógica lateral"
}

def generar_un_reto(categoria, ruta_guardado):
    """Genera un único reto y lo guarda en la ruta especificada."""
    print(f"Generando reto para la categoría: {categoria}...")
    prompt = f"Crea un reto de lógica original sobre '{categoria}'. Devuelve EXCLUSIVAMENTE en formato JSON con la siguiente estructura: {{\"titulo\": \"...\", \"objetivo\": \"...\"}}"
    
    try:
        response = model.generate_content(prompt)
        reto_json = json.loads(response.text.replace("```json", "").replace("```", "").strip())
        
        # Crear directorio si no existe
        os.makedirs(os.path.dirname(ruta_guardado), exist_ok=True)
        
        with open(ruta_guardado, "w", encoding="utf-8") as f:
            json.dump(reto_json, f, ensure_ascii=False, indent=2)
        print(f"✅ Reto guardado en {ruta_guardado}")
        return True
    except Exception as e:
        print(f"❌ Error generando un reto: {e}")
        return False

def modo_lote():
    """Modo para generar múltiples retos y guardarlos en el almacén."""
    print("Iniciando modo de generación en lote...")
    # Leemos cuántos retos generar por categoría desde la variable de entorno
    count = int(os.environ.get('COUNT_PER_CATEGORY', 5))
    
    for categoria_nombre in HORARIO.values():
        # Creamos un nombre de carpeta válido (ej: 'logica_deductiva')
        nombre_carpeta = categoria_nombre.split(' ')[0].lower()
        
        for i in range(1, count + 1):
            ruta = f"almacen_retos/{nombre_carpeta}/reto_{i}.json"
            if not os.path.exists(ruta):
                generar_un_reto(categoria_nombre, ruta)
            else:
                print(f"El archivo {ruta} ya existe, saltando.")

def modo_diario():
    """Modo para generar un único reto para el futuro (lógica original)."""
    print("Iniciando modo de generación diario...")
    # (Esta función ahora es menos importante, pero la mantenemos por si acaso)
    # Lógica para generar un solo reto para dentro de 7 días...


if __name__ == "__main__":
    # El script decide qué hacer basándose en la variable de entorno
    mode = os.environ.get('GENERATION_MODE')

    if mode == 'bulk':
        modo_lote()
    else:
        # Por defecto, o si no se especifica, no haría nada o podrías poner el modo_diario()
        print("Modo no especificado o no reconocido. Terminando script.")