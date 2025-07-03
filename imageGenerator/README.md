# Generador de imágenes

## Entorno virtual

Se recomienda usar un entorno virtual para manejar las dependencias de la libraria de generación.

🔨 Crear entorno virtual `.\venv`:
```
python -m venv venv
```

🚀 Activar entorno virtual `.\venv`:
```
.\venv\Scripts\Activate.ps1
```

## Dependencias

📦 Instala las dependencias neceasrias con:
```
pip install -r requirements.txt
```

## Generar

La carpeta contiene un archivo `main.py` que contiene el código experimental para la generación automática de imágenes de observaciones.

```
python -m main 
```

Cada imagen producida tiene un archivo de etiquetas con información de los límites de la imagen que definen cada observación individual y los espectros de ciencia y/o de lámparas de comparación que haya en la misma.

## Libreria de generación

`observationArtist.py` encapsula funciones utiles para el dibujado de observaciones en archivos.