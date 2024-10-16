# PlateUNLP

## Ejecucion en Docker

### Requerimientos

- Docker

### Preparacion

Para la correcta ejecución de los contenedores debe tener preparado un archivo `.env` que asigne valores adecuados a las variables de entorno que requiere el arhivo `docker-compose.yml`.

Para su creacion puede duplicar el archivo `.env.sample` que esta en la carpeta raiz del repositorio,cambiarle el nombre a `.env` y modificar las variables que declara segun las necesidades de su equipo.

### Ejecucion

Para levantar el conjunto de contenedores ejecutar:
```
docker compose --env-file=.env up
```
En caso de que lo que quiera sea actualizar los contenedores agregue al final el tag `--build`, tal que asi:
```
docker compose --env-file=.env up --build
```

### Acceso a la app

Una vez levantado el entorno de produccion puede acceder al la aplicacion desde `localhost:5000`.

Tambien puede acceder a la API expuesta por el backend desde `localhost:20500`

## Ejecucion sin docker

### Requerimientos
#### Backend
- Python (v3.8)
#### Frontend
- [Node js](https://nodejs.org/en/download) (v12.22.7)
- [Visual Studio BuildTools](https://visualstudio.microsoft.com/es/downloads/)

### Instalación de dependencias
#### Backend
Para instalar las dependencias del backend pocisionarse en la carpeta `/backend`, activar el entorno virtual en caso de que se emplee y ejecutar:

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


## Links de interes
- [proyecto de Recuperación del Trabajo Observacional Historico (ReTrOH)](https://retroh.fcaglp.unlp.edu.ar/)

















