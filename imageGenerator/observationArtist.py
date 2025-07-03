from numbers import Number
import random
from matplotlib import pyplot as plt
from numpy.typing import NDArray
from typing import Any, Callable, Tuple
import numpy as np
import cv2
import sys

# Alias para evitar incompativilidades con pystellibs
import astropy.io.fits as pyfits
sys.modules['pyfits'] = pyfits


"""Funcion que recibe la informacion de una imagen en formato
matricial y dibuja una observacion en la misma acorde a las 
cordenadas especificadas.
IMPORTANTE: a menos que se especifique la funcion modifica la 
matriz recibida en vez de hacer una copia.
IMPORTANTE: se espera que la imagen base sea oscura, para pintar
la observacion se sigue una estrategia de pixel mas alto, si el 
fondo en una parte que se superpone con la observacion tiene un
color mas claro entonces se pinta el pixel del fondo. Esto es 
para que la observacion pintada se mezcle bien con la imagen.

params:
- img {NDArray[np.uint8]}: matriz de pixeles que representa la 
imagen.
- x {int}: coordenada horizontal central donde se dibujara el espectro.
- y {int}: coordenada vertical central donde se dibujara el espectro.
- width {int}: ancho de la observación a dibujar.
- height {int}: alto de la observación a dibujar.
- openingLamp {float}: apertura porcentual de la lampara. (0, 0.5) acorde 
al alto de la observacion.
- distanceBetweenParts {float}: distancia porcentual entre partes de un 
espectro. (0, 0.33) acorde al alto de la observacion.
- angle {int}?: angulo de inclinacion de la observacion a dibujar.
- inplace {bool}?: condicion que indica si se realizaran los cambios
sobre la imagen recibida o sobre una copia. Default True.
- baseGrey {int}?: nivel de gris minimo a considerar. Default 1.
- debug {bool}?: al activar se pinta las cajas delimitadoras de la observacion
generada sobre la imagen. Default False.

return 
- {NDArray[np.uint8]}: matriz de pixeles que representa la 
imagen con la observacion agregada.
- {NDArray[np.uint8]}: matriz de pixeles que representa solo la observacion
generada acorde a las dimensiones de la imagen recibida. Todos los pixeles que
no corresponden a la observación son 0.
- {NDArray[np.uint8]}: mascara de locación del espectro.
- {dict[str, Number]}: informacion de caja delimitadora de la observación (formato
yolov11).
"""

def drawObservation(
        img: NDArray[np.uint8], 
        x:int, y:int, width:int, height:int, 
        opening:float, distanceBetweenParts:float,
        angle:int=0, inplace:bool=True, 
        baseGrey:int = 1, debug:bool=True) -> NDArray[np.uint8]:
    
    if not inplace:
        img = img.copy()


    # Crear el rectángulo de observacion rotado
    rectObservation = ((x, y), (width, height), angle)

    # Crear el rectangulo de cada parte de la observacións
    openingInPixel = round(height * opening)
    distanceBetweenPartsInPixel = round(height * distanceBetweenParts)
    centerLamp1 = (x, y-(height-openingInPixel)/2) 
    centerLamp2 = (x, y+(height-openingInPixel)/2)
    rectParts = {
        "lamp1": (centerLamp1, (width, openingInPixel), 0),
        "lamp2": (centerLamp2, (width, openingInPixel), 0),
        "science": ((x,y), (width, height-openingInPixel*2-distanceBetweenPartsInPixel*2), 0),
    }
    boxParts = {
        "lamp1": np.int32(cv2.boxPoints(rectParts["lamp1"])),
        "lamp2": np.int32(cv2.boxPoints(rectParts["lamp2"])),
        "science": np.int32(cv2.boxPoints(rectParts["science"])),
    }
    
    # Obtener las esquinas del rectángulo de observacion
    boxObservation = cv2.boxPoints(rectObservation)
    boxObservation = np.int32(boxObservation)

    # Preparar etiqueta de caja delimitadora para grafico
    allBoxs = np.concatenate([boxObservation], axis=0)
    x_coords = allBoxs[:,0]
    y_coords = allBoxs[:,1]
    labelForGraph: dict[str, Number] = {
        "x":x_coords.min(), 
        "y":y_coords.min(), 
        "width":x_coords.max() - x_coords.min(), 
        "height":y_coords.max() - y_coords.min(), 
    }

    # Preparar etiquetas en formato yolov11 para reportar al usuario
    labelObservation: dict[str, Number] = {
        "class_id": 0,
        "x_center_norm":((x_coords.min() + x_coords.max())/2)/width,
        "y_center_norm":((y_coords.min() + y_coords.max())/2)/height,
        "width_norm": labelForGraph["width"] / width,
        "height_norm": labelForGraph["height"] / height,
    }

    if (debug):
        cv2.rectangle(   # Etiqueta (Caja delimitadora)
            img,
            (labelForGraph["x"], labelForGraph["y"]),
            (labelForGraph["x"] + labelForGraph["width"], labelForGraph["y"] + labelForGraph["height"]), 
            (255,0,0), thickness=3
        )

    # Mascara para cada parte del espectro.
    maskParts = {
        "lamp1": np.zeros(img.shape[:2], dtype=np.uint8),
        "lamp2": np.zeros(img.shape[:2], dtype=np.uint8),
        "science": np.zeros(img.shape[:2], dtype=np.uint8) 
    }
    cv2.drawContours(maskParts["lamp1"], [boxParts["lamp1"]], 0, 255, thickness=cv2.FILLED)
    cv2.drawContours(maskParts["lamp2"], [boxParts["lamp2"]], 0, 255, thickness=cv2.FILLED)
    cv2.drawContours(maskParts["science"], [boxParts["science"]], 0, 255, thickness=cv2.FILLED)

    # Mascara general
    maskObservation = np.zeros(img.shape[:2], dtype=np.uint8)
    cv2.drawContours(maskObservation, [boxParts["lamp1"]], 0, 255, thickness=cv2.FILLED)
    cv2.drawContours(maskObservation, [boxParts["lamp2"]], 0, 255, thickness=cv2.FILLED)
    cv2.drawContours(maskObservation, [boxParts["science"]], 0, 255, thickness=cv2.FILLED)

    # Pintar espectro de ciencia
    onlyObservation = np.zeros((*img.shape[:2], 3), dtype=np.uint8)
    ys, xs = np.where(maskParts["science"] == 255)
    vertical_noise_level = random.uniform(0,0.6)
    science_function = spectral_function(
        width=labelForGraph["width"], 
        noise_level=255*0.01, 
        n_peaks=random.randint(4, 15),
        baseline=0,
        vertical_noise_level= vertical_noise_level,
        peak_spread=2.6,
        n_absorption_lines=random.randint(0, 5),
        absorption_lines_spread=random.uniform(0.01, 0.5),
        )
    for xi, yi in zip(xs, ys):
        intensity = science_function(xi-labelForGraph["x"])
        intensity = max(intensity,baseGrey) # Control de color de fondo
        onlyObservation[yi, xi] = (intensity,intensity,intensity)

    # Pintar lampara de comparación 1
    lamp_function = spectral_function(
        width=labelForGraph["width"], 
        noise_level=255*0.01, 
        n_peaks=random.randint(15, 50),
        baseline=255 * random.uniform(0.05, 0.1),
        vertical_noise_level=vertical_noise_level,
        peak_spread=0.04,
        n_absorption_lines=0,
        )
    ys, xs = np.where(maskParts["lamp1"] == 255)
    for xi, yi in zip(xs, ys):
        intensity = lamp_function(xi-labelForGraph["x"])
        intensity = max(intensity,baseGrey) # Control de color de fondo
        onlyObservation[yi, xi] = (intensity,intensity,intensity)

    # Pintar lampara de comparación 2
    ys, xs = np.where(maskParts["lamp2"] == 255)
    for xi, yi in zip(xs, ys):
        intensity = lamp_function(xi-labelForGraph["x"])
        intensity = max(intensity,baseGrey) # Control de color de fondo
        onlyObservation[yi, xi] = (intensity,intensity,intensity)

    # Rotar espectro y mascara acorde a la cantidad de grados.
    M = cv2.getRotationMatrix2D((x,y), angle, 1)
    onlyObservation = cv2.warpAffine(onlyObservation, M, (img.shape[1], img.shape[0]))
    maskObservation = cv2.warpAffine(maskObservation, M, (img.shape[1], img.shape[0]))

    # Fusionar con la imagen recibida
    # mask = maskObservation > 0  # shape: (H, W), dtype: bool
    # mask_3ch = np.stack([mask] * 3, axis=-1)  # shape: (H, W, 3)
    # img = np.where(mask_3ch, onlyObservation, img)    # Pintar observacion arriba
    img = np.maximum(img, onlyObservation)  # Quedarse con los pixeles mas altos.

    return img, onlyObservation, maskObservation, labelObservation


"""Genera una funcion que representa un espectro de ciencia sintetico.

Parametros:
- width {int}: ancho que tienen que cubrir los resultados.
- noise_level {float}: Amplitud del ruido base (sobre 255).
- n_peaks {int}: cantidad de picos a simular.
- baseline {int}: valor minimo.
- vertical_noise_level {float}?: Amplitud del ruido base vertical (sobre 255).
Default 0.2.
- peak_spread {float}?: multiplicador que afecta al ancho de los picos simulados. 
Default 1.0.
- n_absorption_lines {int}?: cantidad de lineas de absorción a simular. Default 0.
- absorption_lines_spread {float}?: multiplicador que afecta al ancho de los las 
lineas de absorcion simuladas. Default 1.0.

Return:
- {Callable[[int], int]}: funcion que dado un valor entero informa la intensidad
que le corresponde.
"""
def spectral_function(width:int, noise_level:float, n_peaks:int, baseline:int, 
                      vertical_noise_level:float=0.2, peak_spread:float=1.0, 
                      n_absorption_lines:int=0, 
                      absorption_lines_spread:float = 1.0) -> Callable[[int], int]:

    x = np.arange(width)

    # Crear fondo con ruido blanco gaussiano centrado en 0
    noise = np.random.normal(loc=0.0, scale=noise_level, size=width)

    # Espectro inicial como ruido (más ruido positivo)
    spectrum = noise.clip(min=0)

    # Agregar n picos gaussianos con alturas y anchos aleatorios
    for _ in range(n_peaks):
        peak_center = np.random.uniform(0, width)
        peak_width = np.random.uniform(width*0.01, width*0.1) * peak_spread
        peak_height = np.random.uniform(50, 255)

        # Gaussiana: height * exp(- (x - center)^2 / (2*sigma^2))
        gaussian_peak = peak_height * np.exp(- (x - peak_center)**2 / (2 * peak_width**2))

        spectrum += gaussian_peak
    
    # Agregar n líneas de absorción (gaussianas invertidas)
    for _ in range(n_absorption_lines):
        abs_center = np.random.uniform(0, width)
        abs_width = np.random.uniform(width*0.01, width*0.04) * absorption_lines_spread
        abs_depth = np.random.uniform(20, 100)  # Qué tan profundas son

        gaussian_absorption = abs_depth * np.exp(- (x - abs_center)**2 / (2 * abs_width**2))
        if random.choice([0,1]) == 0:
            spectrum -= gaussian_absorption
        else:
            spectrum += gaussian_absorption # Algunas lineas las suma

    # Pequeñas lineas blancas aleatorias
    spectrum += np.random.rand(width)*vertical_noise_level

    # Normalizar a rango [0, 1]
    spectrum -= spectrum.min()
    if spectrum.max() > 0:
        spectrum /= spectrum.max()

    # Escalar a [baseline, 255]
    spectrum = baseline + spectrum * (255 - baseline)

    spectrum = spectrum.astype(np.uint8)

    def intensity(xi: int) -> int:
        if xi < 0 or xi >= width:
            return 0
        return int(spectrum[xi])
    
    return intensity

"""Rotar un punto en relacion centro segun la formula de rotacion 2D.

Parametros:
- x {Number}: X del punto a rotar.
- y {Number}: Y del punto a rotar.
- cx {Number}: X del centro.
- cy {Number}: Y del centro.
- angle_degrees {Number}: angulo de rotación (en grados).

Return:
- {Tuple[Number,Number]}: punto luego de rotar.
"""
def rotate_point(x:Number, y, cx, cy, angle_degrees) -> Tuple[Number,Number]:
    theta = np.radians(angle_degrees)

    # Trasladar el punto para que el centro sea el origen
    tx = x - cx
    ty = y - cy

    # Aplicar rotación
    rx = tx * np.cos(theta) - ty * np.sin(theta)
    ry = tx * np.sin(theta) + ty * np.cos(theta)

    # Trasladar de vuelta
    return rx + cx, ry + cy



"""Añadir ruido realista a una imagen.

Parametros:
- gaussian_std {float}?: ruido gaussiano. Simula imperfecciones naturales del sensor 
o de la pelicula fotografica. Se basa en una distribucion normal o gaussiana. Default 10.0.
- band_intensity {float}?: ruido de banda (horizontal o vertical). Default 5.0.
- speck_count {int}?: cantidad de manchas de impuresa a simular.
- speck_size {int}?: tamaño maximo de mancha de impuresa. Default 3.
- blur_ksize {int}?: tamaño del kernel para desenfoque gaussiano. Debe ser impar, con 0 
u otro valor invalido no se aplica ningun desenfoque. Default 3.
"""
def add_realistic_noise(
    img: NDArray[np.uint8],
    gaussian_std: float = 10.0,
    band_intensity: float = 5.0,
    speck_count: int = 10,
    speck_size: int = 3,
    blur_ksize: int = 3,
) -> NDArray[np.uint8]:
    img_noisy = img.astype(np.float32)

    # 1. Ruido gaussiano (general)
    noise = np.random.normal(0, gaussian_std, img.shape)
    img_noisy += noise

    # 2. Ruido en bandas horizontales (tiras verticales o líneas horizontales)
    band = np.random.normal(0, band_intensity, (img.shape[0], 1, 1))
    img_noisy += band

    # 3. Puntos blancos o manchas (tipo polvo o defecto)
    for _ in range(speck_count):
        cx = np.random.randint(0, img.shape[1])
        cy = np.random.randint(0, img.shape[0])
        radius = 1 if speck_size <= 1 else np.random.randint(1, speck_size)
        color = np.random.randint(150, 255)  # blanco sucio
        cv2.circle(img_noisy, (cx, cy), radius, (color,) * 3, cv2.FILLED)

    # 4. Desenfoque suave (simula ópticas imperfectas)
    if blur_ksize >= 3 and blur_ksize % 2 == 1:
        img_noisy = cv2.GaussianBlur(img_noisy, (blur_ksize, blur_ksize), 0)


    # Clip y convertir de vuelta a uint8
    img_noisy = np.clip(img_noisy, 0, 255).astype(np.uint8)
    return img_noisy

"""Recibe la informacion de una etiqueta en formato dict y la convierte a un 
string en formato Yolov11.

Parametros:
- label {dict[str, Number]}: informacion de la etiqueta a parsear.

Return:
- {str}: información de la etiqueta en formato textual
"""
def labelDictToYolov11Format(label) -> str:
    return f"{label['class_id']} {label['x_center_norm']:.6f} {label['y_center_norm']:.6f} {label['width_norm']:.6f} {label['height_norm']:.6f}"