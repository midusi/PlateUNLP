"""import sys
sys.path.append("..") #Es necesario para importar Recursos.py
import Recursos
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
"""
#graficar funcion resultante de filtro savgol

#graficar segunda derivada de la funcion
#encontrar puntos de inflexion (PI) y graficar - superponer
#%%
import sys
sys.path.append("..") #Es necesario para importar Recursos.py
import Recursos
import csv
from astropy.io import fits
import pandas as pd

dirImg = "f:\\GITHUB_TRABAJOS\\proyecto_astro_PPS\\notebooks\\fits"
planilla = pd.read_csv('Etapa_1_ObservacionDeDatos/planilla_imagenes.csv',  sep=';')
df = pd.DataFrame(planilla.values, columns = list(planilla))
df.head()    
#%%
cantEspectros = []
for tupla in df.itertuples():
    nombreImg = Recursos.obtenerNombre(tupla.PLATE_N, tupla.OBJECT)
    cantEspectros.append((fits.getheader(dirImg+'\\'+nombreImg, ignore_missing_end=True))['SPEC-AMO'])
print('fin carga de columna')
df['SPECTRO_AMOUNT'] = cantEspectros
#%%
df.head()    

# %%
print(df['SPECTRO'] == df['SPECTRO_AMOUNT'])
# %%
results = df['SPECTRO'] == df['SPECTRO_AMOUNT']
results.count()
# %%
dataset = pd.Series(results)
dataset.value_counts()
# %%
df.to_csv('planilla_imagenes_2.csv',sep=';')
# %%
planilla_v2 = pd.read_csv('planilla_imagenes_2.csv',  sep=';')
tabla = pd.DataFrame(planilla_v2.values, columns = list(planilla_v2))
tabla.head()
dataset2 = pd.Series(tabla['SPECTRO'] == tabla['SPECTRO_AMOUNT'])
dataset2.value_counts()
# %%
tabla
# %%
