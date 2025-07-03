import os
import numpy as np
import random
import cv2
from observationArtist import drawObservation, add_realistic_noise, labelDictToYolov11Format
import math
import PIL.Image as Image

# Dimensiones deseadas.
alto = random.randint(1000, 4000)
ancho = random.randint(1000, 4000)

# Imagen negra completa.
gray_value = np.random.randint(0, 0.15*255)
img = np.full((alto, ancho, 3), gray_value, dtype=np.uint8)
print(alto, ancho)

# Ancho de la observacion que varia en relacion al ancho total disponible.
obs_width = random.randint(int(ancho*0.4), int(ancho*0.99))
# Alto total de la observacion que varia en relacion al ancho de la misma.
obs_heigth = random.randint(int(obs_width*0.1), int(obs_width*0.4))
# Inclinacion de la observacion.
angle = random.randint(-5, 5)
# Que tan anchas van a ser los espectros de lampara en relacion al espectro de ciencia
openingLamp = random.uniform(0.1,0.35)
# Cuanto espacio vacio hay entre cada lampara y el espectro de ciencia.
distanceBetweenParts = random.uniform(0.02,0.1)

# Distancia entre distintas observaciones
distanceBetweenObservations = random.uniform(obs_heigth*0.1, obs_heigth*0.8)
# Cantidad de observaciones que entran en la imagen
max_observations = math.floor(alto*0.9/(obs_heigth+distanceBetweenObservations))
# Cuantas observaciones se dibujaran en una la imagen
n_observations = min(max_observations, random.randint(1, 5))
# Posiciones donde ser realizara el dibujo centradas en alto
noise_horizontal = 0.01 # Irregularidad porcentual horizontal maxima
noise_vertical = 0.01 # Irregularidad porcentual veartical maxima
unit = obs_heigth + distanceBetweenObservations# Espacio a considerar por observación
targets = []
for i in range(n_observations):
    pos_y = (alto/2) - (n_observations/2)*unit + unit/2 + i*unit
    coor = {
        "x": ancho/2 + random.uniform(-noise_horizontal, noise_horizontal), 
        "y": pos_y + random.uniform(-noise_vertical, noise_vertical), 
    }
    targets.append(coor)

labels = []
for coor in targets:
    img, _obs, _mask, label = drawObservation(
        img=img,
        x=coor["x"], 
        y=coor["y"],
        width=int(obs_width),
        height=int(obs_heigth),
        opening=openingLamp,
        distanceBetweenParts=distanceBetweenParts,
        angle=angle,
        baseGrey=gray_value,
        inplace=True,
        debug=False,
        )
    labels.append(label)

# Ruido gaussiano general para la imagen de la placa
gaussian_std = random.uniform(4.0, 16.0)
# Ruido de banda horizontal
band_intensity = random.uniform(0.0, 1.0)
# Cantidad de manchas de polvo
speck_count = random.randint(0,10)
# Radio maximo de las manchas de polvo
speck_size = random.randint(1,5)
# Nivel del desenfoque gaussiano
speck_size = random.choice([1, 3, 5, 7, 9, 11, 13, 15])

img = add_realistic_noise(
        img, 
        gaussian_std=gaussian_std,
        band_intensity=band_intensity,
        speck_count=speck_count,
        speck_size=speck_size,
        blur_ksize=speck_size,
    )

# Guardar imagen sintetica
success = cv2.imwrite('img.jpg', img)
# cv2.imwrite('obs.jpg', obs)
# cv2.imwrite('mask.jpg', mask)
if not success:
    print("¡Error al guardar la imagen! Verifica la ruta y permisos.")
else:
    print("Imagen guardada correctamente en imageGenerator/negro.jpg")

# Convertir etiquetas a texto
lines = map(labelDictToYolov11Format, labels)

# Guardar etiquetas
if lines:
    with open('img.txt', "w") as f:
        f.write("\n".join(lines))
else:
    # Recomendado: no crear archivo si no hay objetos
    if os.path.exists('img.txt'):
        os.remove('img.txt')
