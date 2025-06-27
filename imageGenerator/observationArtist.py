from numbers import Number
import random
from matplotlib import pyplot as plt
from numpy.typing import NDArray
from typing import Any, Callable, Tuple
import numpy as np
import cv2
from pystellibs import BaSeL, Rauch, Kurucz, Tlusty, Munari
import sys

# Alias para evitar incompativilidades con pystellibs
import astropy.io.fits as pyfits
sys.modules['pyfits'] = pyfits


"""Funcion que recibe la informacion de una imagen en formato
matricial y dibuja una observacion en la misma acorde a las 
cordenadas especificadas.
IMPORTANTE: a menos que se especifique la funcion modifica la 
matriz recibida en vez de hacer una copia.

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

return 
- {NDArray[np.uint8]}: matriz de pixeles que representa la 
imagen con la observacion agregada.
- {NDArray[np.uint8]}: mascara de locación del espectro.
"""

def drawObservation(
        img: NDArray[np.uint8], 
        x:int, y:int, width:int, height:int, 
        opening:float, distanceBetweenParts:float,
        angle:int=0, inplace:bool = True, baseGrey:int = 1) -> NDArray[np.uint8]:
    
    if not inplace:
        img = img.copy()

    # Crear el rectángulo de observacion rotado
    rectObservation = ((x, y), (width, height), angle)

    # Crear el rectangulo de cada parte de la observacións
    openingInPixel = round(height * opening)
    distanceBetweenPartsInPixel = round(height * distanceBetweenParts)
    centerLamp1 = rotate_point(x=x,y=y-(height-openingInPixel)/2,
                               cx=x, cy=y, angle_degrees=angle)
    centerLamp2 = rotate_point(x=x,y=y+(height-openingInPixel)/2,
                               cx=x, cy=y, angle_degrees=angle)
    rectParts = {
        "lamp1": (centerLamp1, (width, openingInPixel), angle),
        "lamp2": (centerLamp2, (width, openingInPixel), angle),
        "science": ((x,y), (width, height-openingInPixel*2-distanceBetweenPartsInPixel*2), angle),
    }
    boxParts = {
        "lamp1": np.int32(cv2.boxPoints(rectParts["lamp1"])),
        "lamp2": np.int32(cv2.boxPoints(rectParts["lamp2"])),
        "science": np.int32(cv2.boxPoints(rectParts["science"])),
    }
    

    # Obtener las esquinas del rectángulo de observacion
    boxObservation = cv2.boxPoints(rectObservation)
    boxObservation = np.int32(boxObservation)

    # Preparar etiqueta de caja delimitadora
    allBoxs = np.concatenate([boxParts["lamp1"], boxParts["lamp2"], boxParts["science"]], axis=0)
    x_coords = allBoxs[:,0]
    y_coords = allBoxs[:,1]
    labelObservation = {
        "x":x_coords.min(), 
        "y":y_coords.min(), 
        "width":x_coords.max() - x_coords.min(), 
        "height":y_coords.max() - y_coords.min(), 
    }

    # Crear máscara
    maskObservation = np.zeros(img.shape[:2], dtype=np.uint8)
    cv2.drawContours(maskObservation, [boxObservation], 0, 255, thickness=cv2.FILLED) # Limites observacion
    # cv2.rectangle(   # Etiqueta (Caja delimitadora)
    #     img,
    #     (labelObservation["x"], labelObservation["y"]),
    #     (labelObservation["x"] + labelObservation["width"], labelObservation["y"] + labelObservation["height"]), 
    #     (255,0,0), thickness=3
    # )

    # Mascara para cada parte del espectro.
    maskParts = {
        "lamp1": np.zeros(img.shape[:2], dtype=np.uint8),
        "lamp2": np.zeros(img.shape[:2], dtype=np.uint8),
        "science": np.zeros(img.shape[:2], dtype=np.uint8) 
    }
    cv2.drawContours(maskParts["lamp1"], [boxParts["lamp1"]], 0, 255, thickness=cv2.FILLED)
    cv2.drawContours(maskParts["lamp2"], [boxParts["lamp2"]], 0, 255, thickness=cv2.FILLED)
    cv2.drawContours(maskParts["science"], [boxParts["science"]], 0, 255, thickness=cv2.FILLED)

    # Pintar espectro de ciencia
    ys, xs = np.where(maskParts["science"] == 255)
    science_function = spectral_function(
        width=labelObservation["width"], 
        noise_level=255*0.01, 
        n_peaks=random.randint(4, 15),
        baseline=0,
        peak_spread=2.6,
        )
    for xi, yi in zip(xs, ys):
        intensity = science_function(xi-labelObservation["x"])
        intensity = max(intensity,baseGrey) # Control de color de fondo
        img[yi, xi] = (intensity,intensity,intensity)

    # Pintar lampara de comparación 1
    lamp_function = spectral_function(
        width=labelObservation["width"], 
        noise_level=255*0.01, 
        n_peaks=random.randint(15, 50),
        baseline=255 * random.uniform(0.05, 0.1),
        peak_spread=0.04,
        )
    ys, xs = np.where(maskParts["lamp1"] == 255)
    for xi, yi in zip(xs, ys):
        intensity = lamp_function(xi-labelObservation["x"])
        intensity = max(intensity,baseGrey) # Control de color de fondo
        img[yi, xi] = (intensity,intensity,intensity)

    # Pintar lampara de comparación 2
    ys, xs = np.where(maskParts["lamp2"] == 255)
    for xi, yi in zip(xs, ys):
        intensity = lamp_function(xi-labelObservation["x"])
        intensity = max(intensity,baseGrey) # Control de color de fondo
        img[yi, xi] = (intensity,intensity,intensity)

    return img, maskObservation


"""Genera una funcion que representa un espectro de ciencia sintetico.

Parametros:
- width {int}: ancho que tienen que cubrir los resultados.
- noise_level {float}: Amplitud del ruido base (sobre 255).
- n_peaks {int}: cantidad de picos a simular.
- baseline {int}: valor minimo.
- peak_spread {float}?: multiplicador que afecta al ancho de los picos simulados. 
Default 1.0.

Return:
- {Callable[[int], int]}: funcion que dado un valor entero informa la intensidad
que le corresponde.
"""
def spectral_function(width:int, noise_level:float, n_peaks:int, baseline:int, 
                      peak_spread:float=1.0) -> Callable[[int], int]:

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
- speck_count {int}?: granulado simulado. Default 10. 
- speck_size {int}?: manchas o impurezas leves (simulan polvo/defectos de placa). Default 3.
"""
def add_realistic_noise(
    img: NDArray[np.uint8],
    gaussian_std: float = 10.0,
    band_intensity: float = 5.0,
    speck_count: int = 10,
    speck_size: int = 3
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
        radius = np.random.randint(1, speck_size)
        color = np.random.randint(150, 255)  # blanco sucio
        cv2.circle(img_noisy, (cx, cy), radius, (color,) * 3, -1)

    # Clip y convertir de vuelta a uint8
    img_noisy = np.clip(img_noisy, 0, 255).astype(np.uint8)
    return img_noisy