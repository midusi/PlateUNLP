# Spectrogram

## Ejecucion en Docker

### Requerimientos

- Tener instalado Docker

### Preparacion

Para la correcta ejecución de los contenedores debe tener preparado un archivo `.env` que asigne valores adecuados a las variables de entorno que requiere el arhivo `docker-compose.yml`.

Para su creacion puede duplicar el archivo `.env.sample` que esta en la carpeta raiz del repositorio,cambiarle el nombre a `.env` y modificar las variables que declara segun las necesidades de su equipo.

### Ejecucion

Para levantar el conjunto de contenedores ejecutar:
```
docker-compose --env-file=.env up
```
En caso de que tambien quiera actualizar agregar el tag `--build`.


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

Tambien instalar las BuildTools de VS desde `https://visualstudio.microsoft.com/es/downloads/`


## Patchear la clase Upsample de PyTorch

La versión de YOLO utilizada el modelo entrenado depende de un parámetro de PyTorch de la clase Upsample que no existe más. Un fix temporal es reemplazar la línea 152 (de la versión 1.12 de PyTorch) del archivo `torch.nn.modules.upsampling.py` quitando el parámetro `recompute_scale_factor`, de modo que la línea queda:

````
def forward(self, input: Tensor) -> Tensor:
        return F.interpolate(input, self.size, self.scale_factor, self.mode, self.align_corners)
````

## Configurar el directorio con las muestras

Crear un archivo `db.json` en la carpeta `backend/app/static/config`, y configurar el campo `workspace_path` para que apunte a la carpeta donde están/se pondrán los archivos `tiff` a procesar, y se guardarán sus metadatos y resultados. Se puede utilizar el archivo `db.json.example` como ejemplo. Por defecto, este archivo apunta al directorio `test_db`. que tiene archivos de ejemplo para probar el sistema.


## Ejecutar el software en desarrollo

En la carpeta `/backend` una vez activado el entorno virtual, ejecutar:

```bash
python3 run.py
```

En la carpeta `/frontend`, ejecutar:

```bash
npm run dev
```

Accediendo desde el navegador a `localhost:5000` se podrá ver la interfaz gráfica del software.

## Ejecutar el software en producción
Para ejecutar el software en producción se debe posicionar en la carpeta `/frontend` y ejecutar el siguiente comando:
```bash
npm run pm2-start
```
Se dispone de los siguientes scripts: `pm2-start`, `pm2-stop`, `pm2-restart`,`pm2-reload` y `pm2-delete`.

Accediendo desde el navegador a `localhost:5000` se podrá ver la interfaz gráfica del software.