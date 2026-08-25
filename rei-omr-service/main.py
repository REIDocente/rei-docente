from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import json
from omr_processor import procesar_hoja

app = FastAPI(title="REI OMR Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/procesar")
async def procesar(
    imagen: UploadFile = File(...),
    template: str = Form(...)  # JSON string con configuración
):
    try:
        contenido = await imagen.read()
        config = json.loads(template) if isinstance(template, str) else template
        resultado = procesar_hoja(contenido, config)
        return JSONResponse(resultado)
    except Exception as e:
        return JSONResponse({"error": "error_procesamiento", "message": str(e)}, status_code=500)

@app.get("/health")
def health():
    return {"status": "ok", "service": "REI OMR Cloud Run Microservice"}
