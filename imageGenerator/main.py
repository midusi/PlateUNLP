import numpy as np
import random
import cv2
from observationArtist import drawObservation, add_realistic_noise

# Dimensiones deseadas.
alto = random.randint(500, 2000)
ancho = random.randint(500, 2000)

# Imagen negra completa.
gray_value = np.random.randint(0, 0.15*255)
img = np.full((alto, ancho, 3), gray_value, dtype=np.uint8)
print(alto, ancho)

# Ancho de la observacion que varia en relacion al ancho total disponible.
obs_width = random.randint(int(ancho*0.4), int(ancho*0.95))
# Alto total de la observacion que varia en relacion al ancho de la misma.
obs_heigth = random.randint(int(obs_width*0.1), int(obs_width*0.4))
# Inclinacion de la observacion.
angle = random.randint(-5, 5)
# Que tan anchas van a ser los espectros de lampara en relacion al espectro de ciencia
openingLamp = random.uniform(0.1,0.35)
# Cuanto espacio vacio hay entre cada lampara y el espectro de ciencia.
distanceBetweenParts = random.uniform(0.02,0.1)

img, mask = drawObservation(
    img=img,
    x=int(ancho/2), 
    y=int(alto/2),
    width=int(obs_width),
    height=int(obs_heigth),
    opening=openingLamp,
    distanceBetweenParts=distanceBetweenParts,
    angle=angle,
    baseGrey=gray_value
    )

# img = add_realistic_noise(
#     img, 
#     #gaussian_std=19,
#     band_intensity=0)

success = cv2.imwrite('negro.jpg', img)
cv2.imwrite('mask.jpg', mask)
if not success:
    print("¡Error al guardar la imagen! Verifica la ruta y permisos.")
else:
    print("Imagen guardada correctamente en imageGenerator/negro.jpg")