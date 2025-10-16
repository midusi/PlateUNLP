# PlateUNLP

## Ejecución en Docker

### Requerimientos

- Docker

### Preparación

Para la correcta ejecución de los contenedores debe tener preparado un archivo `.env` que asigne valores adecuados a las variables de entorno que requiere el archivo `docker-compose.yml`.

Para su creación puede duplicar el archivo `.env.sample` que esta en la carpeta raíz del repositorio,cambiarle el nombre a `.env` y modificar las variables que declara según las necesidades de su equipo.

### Ejecución

Configurar el directorio de trabajo:

```
export WORKSPACE_PATH=pah
```

Para levantar el conjunto de contenedores ejecutar:
```
# Modo Desarrollo
export WORKSPACE_PATH='ruta de trabajo'
docker-compose --profile development up

# Modo Producción
export WORKSPACE_PATH='ruta de trabajo'
docker-compose --profile production up
```
En caso de que lo que quiera sea actualizar los contenedores agregue al final el tag `--build`, tal que asi:
```
export WORKSPACE_PATH='ruta de trabajo'
docker-compose --profile development --build

export WORKSPACE_PATH='ruta de trabajo'
docker-compose --profile production --build
```

### Acceso a la app

Una vez levantado el entorno de producción puede acceder al la aplicación desde `localhost:5000`.

También puede acceder a la API expuesta por el backend desde `localhost:20500`

## Ejecución sin docker

### Requerimientos
#### Backend
- Python (v3.8)
#### Frontend
- [Node js](https://nodejs.org/en/download) (v12.22.7)
- [Visual Studio BuildTools](https://visualstudio.microsoft.com/es/downloads/)

### Instalación de dependencias
#### Backend
Para instalar las dependencias del backend posesionarse en la carpeta `/backend`, activar el entorno virtual en caso de que se emplee y ejecutar:

```bash
pip install -r requirements.txt
```
#### Frontend
Para instalar las dependencias del frontend es necesario posicionarse en la carpeta `/frontend` y ejecutar:

```bash
npm install
```

### Patchear la clase Upsample de PyTorch (Pre 1.3)

La versión de YOLO utilizada el modelo entrenado depende de un parámetro de PyTorch de la clase Upsample que no existe más. Un fix temporal es reemplazar la línea 152 (de la versión 1.12 de PyTorch) del archivo `torch.nn.modules.upsampling.py` quitando el parámetro `recompute_scale_factor`, de modo que la línea queda:

````
def forward(self, input: Tensor) -> Tensor:
        return F.interpolate(input, self.size, self.scale_factor, self.mode, self.align_corners)
````

### SetUp

Crear un archivo `db.json` en la carpeta `backend/app/static/config`, y configurar el campo `workspace_path` para que apunte a la carpeta donde están/se pondrán los archivos `tiff` a procesar, y se guardarán sus metadatos y resultados. Se puede utilizar el archivo `db.json.example` como ejemplo. Por defecto, este archivo apunta al directorio `test_db`. que tiene archivos de ejemplo para probar el sistema.


### Ejecutar el software en desarrollo

En la carpeta `/backend` una vez activado el entorno virtual, ejecutar:

```bash
python run.py
```

En la carpeta `/frontend`, ejecutar:

```bash
npm run dev
```

Accediendo desde el navegador a `localhost:5000` se podrá ver la interfaz gráfica del software.

### Ejecutar el software en producción

Para ejecutar el software en producción se debe posicionar en la carpeta `/frontend` y ejecutar el siguiente comando:
```bash
npm run pm2-start
```
Se dispone de los siguientes scripts: `pm2-start`, `pm2-stop`, `pm2-restart`,`pm2-reload` y `pm2-delete`.

Accediendo desde el navegador a `localhost:5000` se podrá ver la interfaz gráfica del software.

```
eval "$(/home/user/miniconda3/bin/conda shell.bash hook)"
conda create -n py38 python=3.8.17
conda activate py38
python --version

cd backend
python -m venv venv
source venv/Scripts/activate # gitbash
pip install -r requirements.txt
pm2 start cmd --name backend -- /c "python gateway.wsgi"

cd frontend
npm install
npm run build
pm2 start cmd --name frontend -- /c "npm run start"
```

## Links de interés
- [proyecto de Recuperación del Trabajo Observacional Histórico (ReTrOH)](https://retroh.fcaglp.unlp.edu.ar/)


















