import numpy as np
import random
import cv2
from observationArtist import drawObservation, add_realistic_noise

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

img, obs, mask = drawObservation(
    img=img,
    x=int(ancho/2), 
    y=int(alto/2),
    width=int(obs_width),
    height=int(obs_heigth),
    opening=openingLamp,
    distanceBetweenParts=distanceBetweenParts,
    angle=angle,
    baseGrey=gray_value,
    inplace=False,
    debug=False,
    )

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

success = cv2.imwrite('img.jpg', img)
success = cv2.imwrite('obs.jpg', obs)
cv2.imwrite('mask.jpg', mask)
if not success:
    print("¡Error al guardar la imagen! Verifica la ruta y permisos.")
else:
    print("Imagen guardada correctamente en imageGenerator/negro.jpg")