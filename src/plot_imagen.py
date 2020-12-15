#%%
#import sys
#sys.path.append("..") #Es necesario para importar Recursos.py
#import Recursos.py
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src import Recursos

import matplotlib.image as mpimg
import matplotlib.pyplot as plt

from astropy.io import fits
import numpy as np 

dirImg = "f:\\GITHUB_TRABAJOS\\proyecto_astro_PPS\\notebooks\\fits"
#nombreImg = 'A4516-TetaMus.fits'
nombreImg = 'C1265-HD136488.fits'
image_data = Recursos.obtenerDatos(dirImg,nombreImg)
plt.title('Imagen sin normalizar')
plt.imshow(image_data)
plt.colorbar()
# %%
 
#normalizar los valores de los pixeles de la imagen
pixels_norm = Recursos.normalize_MinMax_2d(image_data)
plt.title('C1265-HD136488 (normalizada)')
plt.imshow(pixels_norm)
plt.colorbar()
# %%
datos = Recursos.sumarizarPixels(pixels_norm)
plt.plot(datos, color='blue')
print('Funcion sin normalizar')
minimos1, maximos1, funcionFiltro1 = Recursos.identificarPicos(datos, nombreImg)

datos_norm = Recursos.normalize_MinMax_1d(datos)
plt.plot(datos_norm, color='blue')
print('Funcion normalizada')
minimos2, maximos2, funcionFiltro2 = Recursos.identificarPicos(datos_norm, nombreImg)

# %%
""" rango1 = []
print('sin normalizar')
rango1 = Recursos.definirRango(minimos1,maximos1)
print(rango1)
Recursos.graficarResultado_v1(pixels_norm, nombreImg, datos, rango1)
Recursos.graficarResultado_v2(pixels_norm, nombreImg, datos, rango1)
 """
print('normalizado')
rango2 = Recursos.definirRango(minimos2,maximos2)
print(rango2)
# %%
#Recursos.graficarResultado_v1(pixels_norm, nombreImg, datos, rango2)
print(rango2[0])
print(rango2[1])
print(pixels_norm.shape[0])
print(pixels_norm.shape[1])

# %%
Recursos.graficarResultado_v1(pixels_norm,nombreImg,funcionFiltro2, rango2)
# %%
Recursos.graficarResultado_v2(pixels_norm, nombreImg, funcionFiltro2, rango2)
#%%
