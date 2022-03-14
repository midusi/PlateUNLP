# Spectrogram

## Software recomendado

Se debe tener instalado Node js y Python en el sistema con sus respectivos gestores de paquetes. Las versiones recomendadas son:

- Node js (v12.22.7) con npm 6.14.15.
- Python (v3.8) con pip 20.0.2.

## Instalación de dependencias

Para instalar las dependencias del backend es necesario posicionarse en la carpeta `/backend` y activar el entorno virtual con el siguiente comando en linux:

```bash
source env/bin/activate
```

En el caso de Windows:

```bash
env\Scripts\activate.bat
```

Por último se instalan las dependencias:

```bash
pip install -r requirements.txt
```

Para instalar las dependencias del frontend es necesario posicionarse en la carpeta `/frontend` y ejecutar:

```bash
npm install
```

## Ejecutar el software

En la carpeta `/backend` una vez activado el entorno virtual, ejecutar:

```bash
python3 run.py
```

En la carpeta `/frontend`, ejecutar:

```bash
npm run dev
```

Accediendo desde el navegador a `localhost:5000` se podrá ver la interfaz gráfica del software.
