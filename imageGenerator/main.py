import numpy as np
import random
import cv2
from observationArtist import drawObservation

# Dimensiones deseadas.
alto = random.randint(1000, 4000)
ancho = random.randint(1000, 4000)

# Imagen negra completa.
img = np.zeros((alto, ancho, 3), dtype=np.uint8)
print(ancho, int(ancho*0.8))

# Ancho de la observacion que varia en relacion al ancho total disponible.
obs_width = random.randint(int(ancho*0.4), int(ancho*0.95))
# Alto total de la observacion que varia en relacion al ancho de la misma.
obs_heigth = random.randint(int(obs_width*0.1), int(obs_width*0.4))
# Inclinacion de la observacion.
angle = random.randint(-30, 30)

img = drawObservation(
    img=img,
    x=int(ancho/2), 
    y=int(alto/2),
    width=int(obs_width),
    height=int(obs_heigth),
    angle=angle,
    )

# Guardar como JPG
cv2.imwrite('imageGenerator/negro.jpg', img)