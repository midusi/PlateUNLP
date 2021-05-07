"""@author Katherine Canaza"""

import os
from astropy.io import fits
import numpy as np 
from numpy import asarray
import matplotlib.pyplot as plt
from scipy.signal import savgol_filter
from scipy.signal import find_peaks 
import bisect as sort
import pandas as pd 
import scipy.stats as stats
#Modelos
from sklearn.mixture import GaussianMixture
import seaborn as sns

def obtenerNombre(plateN, nomObject):
	# .replace(" ", "")	#para eliminar todos los espacios en blanco
	aux = nomObject.split()
	if(len(aux) > 2):
		aux.pop() #se descarta el 3er string ya que no se encuentra dentro de su nombre de archivo
	aux = "".join(aux)	#se concatena el nombre 
	return plateN+'-'+aux+'.fits'
	
def obtenerDirImagenes():
	#se obtiene directorio padre
	pathSuperior = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
	#se descarta las últimas subcarpetas de git para acceder a las img (disco local)
	head, tail = os.path.split(pathSuperior)
	dirSuperior, tail2 = os.path.split(head)
	#print(head2)
	pathImagenes = os.path.join(dirSuperior, 'notebooks', 'fits')
	return pathImagenes

def obtenerListaNombres(directorio):
    listaArchivos = []
    formato = '.fits'
    for dirname, _, filenames in os.walk(directorio):
        for filename in filenames:
            if(formato in os.path.join(filename)):
                listaArchivos.append(os.path.join(filename))
    return listaArchivos

def obtenerListaNombres():
    pathDir =  "f:\\GITHUB_TRABAJOS\\proyecto_astro_PPS\\notebooks\\fits"
    listaArchivos = []
    for dirname, _,filenames in os.walk(pathDir):
        for filename in filenames:
            listaArchivos.append(os.path.join(filename))
    return listaArchivos

def normalize_MinMax_1d(datos):
	return (datos-min(datos)) / (max(datos)-min(datos))
	
def normalize_Zscore(datos):
	return (datos - np.mean(datos)) / np.std(datos)

def normalize_MinMax_2d(pixels):
	#print('Data Type: %s' % pixels.dtype)
	#print('Min: %.3f, Max: %.3f' % (pixels.min(), pixels.max()))
	pixels = pixels.astype('float')
	pixels -= pixels.min()
	pixels /= (pixels.max() - pixels.min())
	#print('Min: %.3f, Max: %.3f' % (pixels.min(), pixels.max()))
	return pixels

def normalize(vector):
    v = np.array(vector.copy(), dtype=np.float64)
    return(v - v.min()) / (v.max() - v.min())

def ajustarMarcosGraficos(tamanio):
	fig = plt.figure(figsize = (tamanio,tamanio))
	#plt.subplots_adjust(top=10, bottom=5, left= 0.10 , hspace= 0.05,wspace= 0.025)
	plt.subplots_adjust(top=15, bottom=10, right=1, left= 0.10,  hspace= 0.05,wspace= 0.025 )
	return fig

def ajustarGraficos(fig, fil, col, nro):
	fig.add_subplot(fil,col,nro)
	return 1

def graficarPicos_Max(dirImg, imagen, cantEspectros):
	#hdu = fits.open(pathImagenes+'\\'+imagen).info()
	hdu_list = fits.open(dirImg+'\\'+imagen, ignore_missing_end=True)
	#se sumariza las columnas para graficar 
	datos = np.apply_along_axis(sum, 0, hdu_list[0].data)
	#se grafica 1ro el espectro
	#plt.plot(range(0,len(datos)),datos)
	plt.plot(datos)
	#se identifica los picos dentro la función
	peaks, properties = find_peaks(datos, prominence=3, width=40)
	#resultados de la busqueda
	#properties["prominences"], properties["widths"]
	#se grafica los picos sobre la función
	plt.plot(peaks, datos[peaks], "x")
	#se grafica las bases y alturas de cada pico encontrado
	#plt.vlines(x=peaks, ymin=x[peaks] - properties["prominences"], ymax = x[peaks], color = "C1")
	#plt.hlines(y=properties["width_heights"], xmin=properties["left_ips"], xmax=properties["right_ips"], color = "C1")
	
	#plt.axis('off')
	titulo = imagen.replace('.fits',"") + ' espectros= '+str(cantEspectros)+ ' picos= '+ str(len(peaks))
	plt.title(titulo)
	plt.show()  #al final de todos los graficos se realiza
	
	return len(peaks) == cantEspectros


def obtenerDatos(dirImg, nombreImg):
	hdu_list = fits.open(dirImg+'\\'+nombreImg, ignore_missing_end=True)
	return asarray(hdu_list[0].data)

def getInfo(nombreImg):
	#DIRECTORIO_IMG =  "f:\\GITHUB_TRABAJOS\\proyecto_astro_PPS\\notebooks\\fits"
	path =  "f:\\GITHUB_TRABAJOS\\proyecto_astro_PPS\\notebooks\\fits"+"\\"+nombreImg
	#print(path)
	data = fits.getdata(path, ignore_missing_end=True)
	#print("get datos..ok")
	clusters = getNroEspectros(path)
	return data, clusters

"""def getImagen(nombreImg):
	path =  "f:\\GITHUB_TRABAJOS\\proyecto_astro_PPS\\notebooks\\png"
	return path"""

def getNroEspectros(nombreImg):
	return np.int((fits.getheader(nombreImg, ignore_missing_end=True))['SPEC-AMO'])

def sumarizarPixels(pixels):
	#se sumariza las columnas para graficar 
	return np.apply_along_axis(sum, 0, pixels)

def identificarPicos(datos, nombre):
	plt.plot(datos)  #se grafica 1ro el espectro
	#se aplica el filtro savgol con un tamaño de ventana  de 111 y un orden de curva de 3.
	datos_filter = savgol_filter(datos,111 ,3)  #ventana impar
	plt.plot(datos_filter, color='green')
	#se identifica los picos maximos dentro la función
	peaksMax, prop1 = find_peaks(datos_filter, prominence=0.4, width=30)
	plt.plot(peaksMax, datos_filter[peaksMax], "o", color='blue')  #se grafica los picos sobre la función
	
	#se identifica los picos mínimos
	peaksMin, prop2 = find_peaks(datos_filter, prominence=(None, 0.6))
	plt.plot(peaksMin, datos_filter[peaksMin], "x", color='red')
	
	plt.title(nombre.replace('.fits',""))
	plt.show()
	
	return peaksMin, peaksMax, datos_filter

#version superpuesta
def graficarResultado_v1(pixels, nombre, datos, rango):
	fig, ax = plt.subplots()
	ax.imshow(pixels)
	ax.plot(datos*pixels.shape[0], '--', linewidth=1, color='red')
	ax.axvline(x= rango[0], color='k', linestyle='--', linewidth=1)
	ax.axvline(x= rango[1], color='k', linestyle='--', linewidth=1)
	plt.show()
	return 1

#version con mas zoom
def graficarResultado_v2(pixels, nombre, datos, rango):
	f, (ax1, ax2) = plt.subplots(2,1, sharex=True)
	ax1.plot(datos)
	ax1.set_ylabel("funcion")
	ax2.imshow(pixels)
	ax2.set_ylabel("imagen")
	ax2.set_aspect('auto')

	ax2.axvline(x= rango[0], color='red', linestyle='--', linewidth=1)
	ax2.axvline(x= rango[1], color='red', linestyle='--', linewidth=1)
	plt.show()
	return 1

def graficarResultadosConValores(pixels, nombre, datos, valores):
	fig, ax = plt.subplots()
	ax.imshow(pixels)
	ax.plot(datos*pixels.shape[0], '--', linewidth=1, color='red')
	for i in valores:
		ax.axvline(x= i * pixels.shape[0], color='white', linestyle='-.', linewidth=2)
	plt.show()
	return 1


def graficar_3d(pixels):
	from mpl_toolkits.mplot3d import Axes3D
	ax = plt.axes(projection='3d')
	y = range( pixels.shape[0] )
	x = range( pixels.shape[1] )  #intercambio 
	X, Y = np.meshgrid(x, y)
	ax.plot_surface( X, Y, pixels )
	return 1

def descartaRepetidos(vector, valor):
	if not (valor in vector):
		pos = sort.bisect(vector,valor)
		vector = np.insert(vector, pos, valor)
	else:
		pos = np.where(vector == valor)[0][0]

	return vector, pos 

def definirRango(minimos, maximos):
	max1 = min(maximos)
	max2 = max(maximos)
	print('Max1: %d' % (max1))
	print('Max2: %d' % (max2))
	#descarta agregar repetidos
	minimos, pos = descartaRepetidos(minimos, max1)
	
	rango = []
	rango.append(minimos[pos - 1])	#extremo izquierdo
	
	if(max1 != max2):
		minimos, pos = descartaRepetidos(minimos, max2)
	rango.append(minimos[pos + 1])

	return rango
	
def verCantTotalMaximos(datos):
	""" plt.barh(range(5), datos, edgecolor='black')
	plt.yticks(range(5), fechas, rotation=60)
	plt.title("Cant de maximos detectados")
	plt.xlim(min(datos)-1, max(datos)+1)
	plt.show() """
	#datos.hist()
	
	""" plt.hist(np.array(datos))
	counts, bins = np.histogram(datos)
	plt.hist(bins[:-1], bins, weights=counts, align='mid') """

	""" etis = [i for i in range(min(m),max(m)+1)]
	counts, bins = np.histogram(m, bins=etis)
	plt.hist(bins[:-1], bins, weights=counts, align='mid') """
	
	dataset = pd.Series(datos)
	#se muestra la informacion de la cantidad de maximos
	#dataset.value_counts().plot(kind='barh', title='Cantidad total de maximos')
	dataset.value_counts()
	return 1

def esPar(nro):
    return (nro % 2) == 0

def obtenerPosicionMedio(vector):
	mitad = len(vector) / 2
	print('medio: '+str(mitad))
	if not(esPar(len(vector))):
		mitad = mitad - 0.5
	return int(mitad)

"""MODELO GMM"""
def modelo_gmm(datos, clusters):
    #Se configura el modelo
    gmm = GaussianMixture(
    n_components=clusters, 
    covariance_type='full')
    #n_init= nro_iters)

    #Se estima el modelo
    gmm.fit(datos.reshape(-1,1))
   
    print("Datos del modelo:")
    print("centroides")
    print(gmm.means_)
    print("%")
    print(gmm.weights_)
    print("std")
    print(np.sqrt(gmm.covariances_))
    return gmm

def generar_nuevos_datos(Y):
    
    Y -= int(Y.min()*0.8)
    #se crean los nuevos datos
    nuevo_dataset = []   #nueva funcion
    for i in range(Y.size):
        #Y[i] es un valor decimal entonces se aplica int
        #se genera tantos datos como diga Y[i]  con el valor i
        nuevos = np.ones( int(Y[i])) *i   
        nuevo_dataset = np.append(nuevo_dataset, nuevos)

    #se muestra la nueva dimension de los datos generados
    print('Dimension de los nuevos datos: '+str(nuevo_dataset.shape))
    return nuevo_dataset

def generar_nuevos_datos_reduc(Y):
    cant = 0
    media = np.mean(Y)
    nuevo_dataset = []   #nueva funcion
    for i in range(Y.size):
        #Y[i] es un valor decimal entonces se aplica int
        #se genera tantos datos como diga Y[i]  con el valor i
        if(Y[i] > media):
            nuevos = np.ones( int(Y[i])) *i   
            nuevo_dataset = np.append(nuevo_dataset, nuevos)
            cant +=1
    
    #se muestra la nueva dimension de los datos generados
    print('Dimension de los nuevos datos: '+str(nuevo_dataset.shape))
    print(str(Y.size - cant)+' datos eliminados')
    return nuevo_dataset

def graficar_regiones(Y,Y_nuevo, modelo, clusters):
    mu = np.abs(modelo.means_.flatten())
    std = np.sqrt(np.abs(modelo.covariances_.flatten()))
    ax = sns.kdeplot(Y_nuevo, shade=False, color='crimson')
    kdeline = ax.lines[0]
    xs = kdeline.get_xdata()
    ys = kdeline.get_ydata()
    
    for i in range(clusters):
        y_values = stats.norm(mu[i], std[i])
        x0 = mu[i]-std[i]
        x1 = mu[i]+std[i]        
        ax.set_ylabel("Densidad de nuevos datos",color="crimson",fontsize=6)
        ax.set_title('Media & desvío estándar del modelo vs distr. KDE')
        ax.vlines(mu[i], 0, np.interp(mu[i], xs, ys), color='crimson', ls=':')
        ax.fill_between(xs, 0, ys, alpha=0.2)
        ax.fill_between(xs, 0, ys, where=(x0 <= xs) & (xs <= x1), interpolate=True, facecolor='crimson', alpha=0.2)
    #se grafica con otro eje y para la funcion reducida de los datos 
    ax2=ax.twinx()
    ax2.plot(Y, color="blue",ls='-')
    ax2.set_ylabel("Y(valores de los datos)",color="blue",fontsize=6)
    #plt.show()
    return ax2
    
def graficar_region_kde(Y, Y_nuevo):
    ax = sns.kdeplot(Y_nuevo, shade=False, color='crimson')
    kdeline = ax.lines[0]
    xs = kdeline.get_xdata()
    ys = kdeline.get_ydata()
    middle = Y_nuevo.mean()
    sdev = Y_nuevo.std()
    left = middle - sdev
    right = middle + sdev
    plt.title('Media & desvío estándar de distr. KDE')
    plt.vlines(middle, 0, np.interp(middle, xs, ys), color='crimson', ls=':')
    plt.fill_between(xs, 0, ys, facecolor='crimson', alpha=0.2)
    plt.fill_between(xs, 0, ys, where=(left <= xs) & (xs <= right), interpolate=True, facecolor='crimson', alpha=0.2)
    #se grafica con otro eje y para la funcion reducida de los datos 
    ax2=ax.twinx()
    ax2.plot(Y, color="blue",ls='-')
    ax2.set_ylabel("Y(valores de los datos)",color="blue",fontsize=6)
    #plt.show()
    return plt