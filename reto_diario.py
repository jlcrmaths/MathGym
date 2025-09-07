import os
import shutil
from datetime import datetime

# Define las categorías para cada día de la semana (Lunes=0, Martes=1, etc.)
HORARIO = {
    0: "logica_deductiva",
    1: "laboratorio_virtual",
    2: "criptoaritmetica",
    3: "secuencia_logica",
    4: "logica_lateral"
}

def publicar_reto_diario():
    """
    Coge un reto del almacén, lo publica como reto.json y lo mueve al histórico.
    """
    # 1. Averiguar qué día es y qué categoría toca
    hoy = datetime.now()
    dia_semana = hoy.weekday() # Lunes es 0, Martes 1...

    # Si es fin de semana, no hace nada
    if dia_semana not in HORARIO:
        print(f"Hoy es fin de semana ({dia_semana}). No se publica nada.")
        return

    nombre_categoria = HORARIO[dia_semana]
    ruta_categoria = os.path.join("almacen_retos", nombre_categoria)
    print(f"Hoy es {dia_semana}, toca la categoría: {nombre_categoria}")

    # 2. Comprobar si quedan retos en el almacén para esa categoría
    if not os.path.exists(ruta_categoria) or not os.listdir(ruta_categoria):
        print(f"⚠️ ¡Alerta! No quedan retos en el almacén para la categoría '{nombre_categoria}'.")
        # Aquí podrías añadir una notificación por email si quisieras
        return

    # 3. Coger el primer reto disponible
    retos_disponibles = sorted(os.listdir(ruta_categoria))
    nombre_reto_a_publicar = retos_disponibles[0]
    ruta_origen = os.path.join(ruta_categoria, nombre_reto_a_publicar)
    
    # 4. Copiarlo a la raíz como "reto.json"
    ruta_destino_publico = "reto.json"
    shutil.copy(ruta_origen, ruta_destino_publico)
    print(f"✅ Reto '{nombre_reto_a_publicar}' copiado a '{ruta_destino_publico}'.")

    # 5. Mover el reto usado a un archivo histórico con la fecha de hoy
    # Esto evita que se vuelva a usar y sirve de registro
    os.makedirs("retos_publicados", exist_ok=True)
    fecha_hoy_str = hoy.strftime('%Y-%m-%d')
    ruta_historico = os.path.join("retos_publicados", f"{fecha_hoy_str}.json")
    shutil.move(ruta_origen, ruta_historico)
    print(f"✅ Reto movido a '{ruta_historico}'.")

if __name__ == "__main__":
    print("Iniciando script de publicación...")
    publicar_reto_diario()
    print("Script de publicación finalizado.")