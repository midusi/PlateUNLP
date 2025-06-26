from matplotlib import pyplot as plt
from numpy.typing import NDArray
from typing import Callable, Tuple
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
- angle {int}?: angulo de inclinacion de la observacion a dibujar.
- inplace {bool}?: condicion que indica si se realizaran los cambios
sobre la imagen recibida o sobre una copia. Default True.

return {NDArray[np.uint8]}: matriz de pixeles que representa la 
imagen con la observacion agregada.
"""
def drawObservation(
        img: NDArray[np.uint8], 
        x:int, y:int, width:int, height:int, 
        angle:int=0, inplace:bool = True) -> NDArray[np.uint8]:

    if not inplace:
        img = img.copy()

    # Color con el que se dibujara el rectangulo
    color = (255, 255, 255)

    # Crear el rectángulo rotado
    rect = ((x, y), (width, height), angle)

    # Obtener las esquinas del rectángulo
    box = cv2.boxPoints(rect)
    box = np.int32(box)
    
    # Crear máscara
    mask = np.zeros(img.shape[:2], dtype=np.uint8)
    cv2.drawContours(mask, [box], 0, 255, thickness=cv2.FILLED)
    # Obtener puntos dentro del rectángulo
    ys, xs = np.where(mask == 255)
    # Pintar píxeles con el color según la función
    science_color = spectral_function()
    for xi, yi in zip(xs, ys):
        color = science_color(xi)
        img[yi, xi] = color

    return img


def spectral_function() -> Callable[[int], Tuple[int, int, int]]:

    # Parámetros estelares aleatorios (puedes ajustarlos según tus necesidades)
    logT = np.random.uniform(3.5, 5.0)  # Temperatura efectiva (log K)
    logg = np.random.uniform(3.0, 5.5)  # Gravedad superficial (log cm/s²)
    logL = np.random.uniform(0.0, 1.5)  # Luminosidad (log L/L☉)
    Z = np.random.uniform(0.0001, +0.5)   # Metalicidad #-3.0

    # Seleccionar la biblioteca espectral
    lib = BaSeL()

    # Generar el espectro estelar
    spectrum = lib.generate_stellar_spectrum(logT, logg, logL, Z)
    #spectrum_normalized = min_max_scale(spectrum, (0, 255))

    printa(spectrum)

    # Graficar el espectro
    plt.figure()
    plt.loglog(lib._wavelength, spectrum, label='BaSel')
    plt.legend(frameon=False, loc='lower right')
    plt.xlabel("Wavelength [{0}]".format(lib.wavelength_unit))
    plt.ylabel("Flux [{0}]".format(lib.flux_units))
    plt.xlim(800, 5e4)
    plt.ylim(1e25, 5e30)
    plt.tight_layout()
    plt.show()

    def color(x:int) -> Tuple[int, int, int]:
        return (0,255,0)
    return color

def min_max_scale(arr, feature_range=(0, 1)):
    arr = np.asarray(arr, dtype=float)
    min_val = arr.min()
    max_val = arr.max()
    if max_val == min_val:
        return np.full_like(arr, feature_range[0])
    scaled = (arr - min_val) / (max_val - min_val)
    lower, upper = feature_range
    return scaled * (upper - lower) + lower