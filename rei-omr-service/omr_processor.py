import cv2
import numpy as np
import math

def procesar_hoja(imagen_bytes: bytes, config: dict) -> dict:
    """
    Procesa la imagen de una hoja de respuestas REÍ utilizando OpenCV.
    1. Decodificación y umbralización adaptativa.
    2. Detección de los 4 marcadores de esquina.
    3. Corrección de perspectiva a canvas normalizado (800x1100).
    4. Evaluación de relleno en las burbujas A, B, C, D.
    """
    try:
        # 1. Decodificar imagen
        nparr = np.frombuffer(imagen_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return {"error": "no_imagen_valida", "calidad": "baja", "message": "No se pudo decodificar la imagen."}

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 2. Umbralización adaptativa (robusto a luz desigual y sombras)
        thresh = cv2.adaptiveThreshold(
            gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV, 21, 10
        )

        # 3. Detectar marcadores de esquina (cuadrados negros sólidos)
        contornos, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        marcadores = []
        h_img, w_img = img.shape[:2]

        for c in contornos:
            area = cv2.contourArea(c)
            x, y, w, h = cv2.boundingRect(c)
            # Filtro por área y relación de aspecto ~ 1.0 (cuadrado)
            if (h_img * w_img * 0.0005) < area < (h_img * w_img * 0.08) and 0.65 < (w / h) < 1.35:
                marcadores.append((x + w // 2, y + h // 2))

        if len(marcadores) < 4:
            return {
                "error": "no_marcadores",
                "calidad": "baja",
                "n_marcadores": len(marcadores),
                "message": "No se detectaron los 4 marcadores de esquina. Por favor encuadra mejor la hoja."
            }

        # 4. Ordenar los 4 marcadores principales: Top-Left (TL), Top-Right (TR), Bottom-Right (BR), Bottom-Left (BL)
        marcadores = sorted(marcadores, key=lambda p: p[0] + p[1])
        tl = marcadores[0]
        br = marcadores[-1]
        resto = [p for p in marcadores if p != tl and p != br]
        if len(resto) < 2:
            return {"error": "no_marcadores", "calidad": "baja", "n_marcadores": len(marcadores)}

        tr = max(resto, key=lambda p: p[0] - p[1])
        bl = min(resto, key=lambda p: p[0] - p[1])

        # 5. Corrección de perspectiva → Canvas de 800x1100
        ancho, alto = 800, 1100
        src = np.float32([tl, tr, br, bl])
        dst = np.float32([[0, 0], [ancho, 0], [ancho, alto], [0, alto]])
        M = cv2.getPerspectiveTransform(src, dst)
        corregida = cv2.warpPerspective(img, M, (ancho, alto))
        corregida_gray = cv2.cvtColor(corregida, cv2.COLOR_BGR2GRAY)
        
        _, corregida_thresh = cv2.threshold(
            corregida_gray, 0, 255,
            cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
        )

        # 6. Generar/Obtener coordenadas según la plantilla solicitada
        tipo_template = config.get("tipo", "REI-30")
        total_preguntas = config.get("total_preguntas", 30)
        
        template_coords = obtener_coordenadas_template(tipo_template, total_preguntas)
        respuestas = {}

        for num_pregunta, opciones in template_coords["preguntas"].items():
            respuestas[num_pregunta] = leer_burbuja(corregida_thresh, opciones)

        return {
            "respuestas": respuestas,
            "calidad": "ok",
            "n_marcadores": len(marcadores),
            "template_usado": tipo_template
        }

    except Exception as e:
        return {"error": "excepcion_omr", "message": str(e)}


def leer_burbuja(img_thresh, opciones: dict) -> dict:
    """
    Evalúa la proporción de relleno de cada opción ('A', 'B', 'C', 'D').
    """
    UMBRAL_RELLENO = 0.35
    marcadas = []

    for letra, pos in opciones.items():
        x, y, r = pos["x"], pos["y"], pos["r"]
        
        # Mascara circular
        mascara = np.zeros(img_thresh.shape, dtype=np.uint8)
        cv2.circle(mascara, (x, y), r, 255, -1)
        
        pixeles_rellenos = cv2.countNonZero(cv2.bitwise_and(img_thresh, mascara))
        area_circulo = math.pi * r * r
        fill = pixeles_rellenos / area_circulo if area_circulo > 0 else 0

        if fill > UMBRAL_RELLENO:
            marcadas.append((fill, letra))

    if len(marcadas) == 0:
        return {"respuesta": None, "estado": "sin_respuesta"}
    if len(marcadas) > 1:
        # Ordenar por mayor relleno por si una es leve marca y otra bien pintada
        marcadas = sorted(marcadas, key=lambda item: item[0], reverse=True)
        if marcadas[0][0] - marcadas[1][0] > 0.25:
            return {"respuesta": marcadas[0][1], "estado": "ok"}
        return {"respuesta": None, "estado": "ambigua", "opciones_detectadas": [m[1] for m in marcadas]}

    return {"respuesta": marcadas[0][1], "estado": "ok"}


def obtener_coordenadas_template(tipo: str, total: int) -> dict:
    """
    Calcula dinámicamente o retorna las coordenadas de la cuadrícula de preguntas.
    Canvas: 800 x 1100 px.
    """
    preguntas = {}
    
    # Parámetros base
    start_y = 220
    row_height = 24 if total > 30 else 32
    r = 11 if total > 30 else 13
    
    # 2 columnas si son más de 20 preguntas
    dos_columnas = total > 20

    for i in range(1, total + 1):
        num_str = str(i)
        
        if dos_columnas:
            col = 0 if i <= math.ceil(total / 2) else 1
            idx_in_col = (i - 1) if col == 0 else (i - 1 - math.ceil(total / 2))
            
            base_x = 130 if col == 0 else 490
            y = start_y + idx_in_col * row_height
        else:
            base_x = 260
            y = start_y + (i - 1) * row_height

        preguntas[num_str] = {
            "A": {"x": base_x + 50,  "y": y, "r": r},
            "B": {"x": base_x + 100, "y": y, "r": r},
            "C": {"x": base_x + 150, "y": y, "r": r},
            "D": {"x": base_x + 200, "y": y, "r": r},
        }

    return {"preguntas": preguntas}
