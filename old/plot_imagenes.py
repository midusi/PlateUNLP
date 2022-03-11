# %%
import sys
sys.path.append("..") #Es necesario para importar Recursos.py
import Recursos
import matplotlib.image as mpimg
import matplotlib.pyplot as plt

from astropy.io import fits
import numpy as np 
import pandas as pd

dirImg = "f:\\GITHUB_TRABAJOS\\proyecto_astro_PPS\\notebooks\\fits"
cantMaximos = []
resultados = []
#listaNombres = Recursos.obtenerListaNombres(dirImg)

planilla = pd.read_csv('Etapa_1_ObservacionDeDatos/planilla_imagenes.csv',  sep=';')
df = pd.DataFrame(planilla.values, columns = list(planilla))

listaNombres = []
for tupla in df.itertuples():
    nombreImg = Recursos.obtenerNombre(tupla.PLATE_N, tupla.OBJECT)
    listaNombres.append(nombreImg)
medio = Recursos.obtenerPosicionMedio(listaNombres)

# %%
#for nro, nombreImg in enumerate(listaNombres):
for nro in range(medio):
    nombreImg = listaNombres[nro]
    image_data = Recursos.obtenerDatos(dirImg,nombreImg)
    pixels_norm = Recursos.normalize_MinMax_2d(image_data)
    datos = Recursos.sumarizarPixels(pixels_norm)
    plt.plot(datos, color='blue')
    print('Funcion sin normalizar')
    minimos1, maximos1, funcionFiltro1 = Recursos.identificarPicos(datos, nombreImg)

    datos_norm = Recursos.normalize_MinMax_1d(datos)
    plt.plot(datos_norm, color='blue')
    print('Funcion normalizada')
    minimos2, maximos2, funcionFiltro2 = Recursos.identificarPicos(datos_norm, nombreImg)
    cantMaximos.append(len(maximos2))
    print('normalizado')
    rango2 = Recursos.definirRango(minimos2,maximos2)
    print(rango2)
    Recursos.graficarResultado_v1(pixels_norm,nombreImg,funcionFiltro2, rango2)
    Recursos.graficarResultado_v2(pixels_norm, nombreImg, funcionFiltro2, rango2)
    print('imagen #'+str(nro))
    resultados.append(input('¿Las marcas son correctas? (T/F)'))
# %%
for nro in range(medio, len(listaNombres)):
    nombreImg = listaNombres[nro]
    image_data = Recursos.obtenerDatos(dirImg,nombreImg)
    pixels_norm = Recursos.normalize_MinMax_2d(image_data)
    datos = Recursos.sumarizarPixels(pixels_norm)
    plt.plot(datos, color='blue')
    print('Funcion sin normalizar')
    minimos1, maximos1, funcionFiltro1 = Recursos.identificarPicos(datos, nombreImg)

    datos_norm = Recursos.normalize_MinMax_1d(datos)
    plt.plot(datos_norm, color='blue')
    print('Funcion normalizada')
    minimos2, maximos2, funcionFiltro2 = Recursos.identificarPicos(datos_norm, nombreImg)
    cantMaximos.append(len(maximos2))
    print('normalizado')
    rango2 = Recursos.definirRango(minimos2,maximos2)
    print(rango2)
    Recursos.graficarResultado_v1(pixels_norm,nombreImg,funcionFiltro2, rango2)
    Recursos.graficarResultado_v2(pixels_norm, nombreImg, funcionFiltro2, rango2)
    print('imagen #'+str(nro))
    resultados.append(input('¿Las marcas son correctas? (T/F)'))

# %%
error = 70
for nro in range(error, len(listaNombres)):
    nombreImg = listaNombres[nro]
    image_data = Recursos.obtenerDatos(dirImg,nombreImg)
    pixels_norm = Recursos.normalize_MinMax_2d(image_data)
    datos = Recursos.sumarizarPixels(pixels_norm)
    plt.plot(datos, color='blue')
    print('Funcion sin normalizar')
    minimos1, maximos1, funcionFiltro1 = Recursos.identificarPicos(datos, nombreImg)

    datos_norm = Recursos.normalize_MinMax_1d(datos)
    plt.plot(datos_norm, color='blue')
    print('Funcion normalizada')
    minimos2, maximos2, funcionFiltro2 = Recursos.identificarPicos(datos_norm, nombreImg)
    cantMaximos.append(len(maximos2))
    print('normalizado')
    rango2 = Recursos.definirRango(minimos2,maximos2)
    print(rango2)
    Recursos.graficarResultado_v1(pixels_norm,nombreImg,funcionFiltro2, rango2)
    Recursos.graficarResultado_v2(pixels_norm, nombreImg, funcionFiltro2, rango2)
    print('imagen #'+str(nro))
    resultados.append(input('¿Las marcas son correctas? (T/F)'))


# %%
print('Resultados de las cantidad de valores de los maximos encontrados')
dataset = pd.Series(cantMaximos)
dataset.value_counts()

# %%
print('Resultados de los aciertos en las marcas (rangos) de imagenes')
dataset = pd.Series(resultados)
dataset.value_counts()

# %%
from sympy import Derivative, diff, simplify

nombreImg = listaNombres[15]
image_data = Recursos.obtenerDatos(dirImg,nombreImg)
pixels_norm = Recursos.normalize_MinMax_2d(image_data)
datos = Recursos.sumarizarPixels(pixels_norm)
plt.plot(datos, color='blue')
print('Funcion sin normalizar')
minimos1, maximos1, funcionFiltro1 = Recursos.identificarPicos(datos, nombreImg)

datos_norm = Recursos.normalize_MinMax_1d(datos)
plt.plot(datos_norm, color='blue')
print('Funcion normalizada')
minimos2, maximos2, funcionFiltro2 = Recursos.identificarPicos(datos_norm, nombreImg)
cantMaximos.append(len(maximos2))
print('normalizado')
rango2 = Recursos.definirRango(minimos2,maximos2)
print(rango2)

print('Segunda derivada')
second = np.gradient(funcionFiltro1)
plt.plot(second)
#%%
second_2 = np.gradient(second)
plt.plot(second_2)
# %%
derivada = np.gradient(funcionFiltro2,2)
plt.plot(derivada)
# %%

nombreImg = listaNombres[37]
image_data = Recursos.obtenerDatos(dirImg,nombreImg)
pixels_norm = Recursos.normalize_MinMax_2d(image_data)
datos = Recursos.sumarizarPixels(pixels_norm)
plt.plot(datos, color='blue')
print('Funcion sin normalizar')
minimos1, maximos1, funcionFiltro1 = Recursos.identificarPicos(datos, nombreImg)

datos_norm = Recursos.normalize_MinMax_1d(datos)
plt.plot(datos_norm, color='blue')
print('Funcion normalizada')
minimos2, maximos2, funcionFiltro2 = Recursos.identificarPicos(datos_norm, nombreImg)
cantMaximos.append(len(maximos2))
print('normalizado')
rango2 = Recursos.definirRango(minimos2,maximos2)
print(rango2)
derivada = np.gradient(funcionFiltro2,2)
plt.plot(derivada)
# %%
nombreImg = listaNombres[51]
image_data = Recursos.obtenerDatos(dirImg,nombreImg)
pixels_norm = Recursos.normalize_MinMax_2d(image_data)
datos = Recursos.sumarizarPixels(pixels_norm)
plt.plot(datos, color='blue')
print('Funcion sin normalizar')
minimos1, maximos1, funcionFiltro1 = Recursos.identificarPicos(datos, nombreImg)

datos_norm = Recursos.normalize_MinMax_1d(datos)
plt.plot(datos_norm, color='blue')
print('Funcion normalizada')
minimos2, maximos2, funcionFiltro2 = Recursos.identificarPicos(datos_norm, nombreImg)
cantMaximos.append(len(maximos2))
print('normalizado')
rango2 = Recursos.definirRango(minimos2,maximos2)
print(rango2)
derivada = np.gradient(funcionFiltro2,2)
plt.plot(derivada)
# %%
