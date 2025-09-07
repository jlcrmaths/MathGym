import google.generativeai as genai
import json
import random
import os
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import credentials, firestore

# --- CONFIGURACIÓN ---
try:
    firebase_creds_json = os.environ.get('FIREBASE_CREDS')
    creds_dict = json.loads(firebase_creds_json)
    cred = credentials.Certificate(creds_dict)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    db = firestore.client()
except Exception as e:
    db = None
    print(f"Advertencia: Firebase no configurado. Error: {e}")

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-pro')
else:
    model = None
    print("Advertencia: API Key de Gemini no encontrada.")

HORARIO = {
    0: "lógica deductiva (estilo Einstein)", 
    1: "laboratorio virtual (trasvases de agua)", 
    2: "criptoaritmética", 
    3: "laboratorio de secuencia (cruzar un río)", 
    4: "lógica lateral"
}
ICONOS = {
    "lógica deductiva (estilo Einstein)": "table", 
    "laboratorio virtual (trasvases de agua)": "bottle", 
    "criptoaritmética": "math-symbols", 
    "laboratorio de secuencia (cruzar un río)": "boat", 
    "lógica lateral": "bulb"
}

def generar_reto(fecha_objetivo_str):
    if not model:
        print("El modelo Gemini no está configurado. Abortando.")
        return

    fecha_objetivo = datetime.strptime(fecha_objetivo_str, '%Y-%m-%d')
    dia_semana = fecha_objetivo.weekday()
    
    if dia_semana not in HORARIO:
        print(f"El {fecha_objetivo_str} es fin de semana. No se genera reto.")
        return

    categoria = HORARIO[dia_semana]
    prompt = f"Actúa como un diseñador de puzzles. Crea un reto de lógica original y único sobre '{categoria}'. El reto debe ser interesante y no trivial. Devuelve la salida EXCLUSIVAMENTE en formato JSON con la siguiente estructura: {{\"titulo\": \"Un título muy llamativo y corto para el reto\", \"objetivo\": \"Una descripción clara y concisa de la meta final que el usuario debe alcanzar\", \"elementos_interactivos\": [], \"condicion_victoria\": \"El estado exacto que determina que el reto se ha superado\"}}"
    
    try:
        response = model.generate_content(prompt)
        reto_json = json.loads(response.text.replace("```json", "").replace("```", "").strip())
        reto_json["fecha"] = fecha_objetivo_str
        icono_tag = ICONOS.get(categoria, "question-mark")
        reto_json["icono_url"] = f"https://raw.githubusercontent.com/tabler/tabler-icons/master/icons/svg/{icono_tag}.svg"

        if not os.path.exists('retos'): os.makedirs('retos')
        nombre_archivo = f"retos/{fecha_objetivo_str}.json"
        with open(nombre_archivo, "w", encoding="utf-8") as f: json.dump(reto_json, f, ensure_ascii=False, indent=2)
        print(f"✅ Reto futuro guardado en {nombre_archivo}")

        if db:
            doc_ref = db.collection('retos').document(fecha_objetivo_str)
            doc_ref.set({'titulo': reto_json['titulo'], 'categoria': categoria, 'visitas': 0, 'suma_valoraciones': 0, 'numero_votos': 0}, merge=True)
            print(f"✅ Entrada futura preparada en Firebase.")
    except Exception as e:
        print(f"❌ Error total en la generación: {e}")

if __name__ == "__main__":
    fecha_input = os.environ.get('FECHA_REGENERAR')
    if fecha_input:
        fecha_target = fecha_input
        print(f"Orden de regeneración recibida para la fecha: {fecha_target}")
    else:
        fecha_target = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
        print(f"Generando reto programado para la fecha: {fecha_target}")
    
    generar_reto(fecha_target)