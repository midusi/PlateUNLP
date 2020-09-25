import os
import matplotlib.pyplot as plt
from scipy.signal import find_peaks
from astropy.io import fits
import numpy as np  

def ajustarMarcosGraficos(tamanio):
	fig = plt.figure(figsize = (tamanio,tamanio))
	#plt.subplots_adjust(top=10, bottom=5, left= 0.10 , hspace= 0.05,wspace= 0.025)
	plt.subplots_adjust(top=15, bottom=10, right=1, left= 0.10,  hspace= 0.05,wspace= 0.025 )
	return fig

def ajustarGraficos(fig, fil, col, nro):
	fig.add_subplot(fil,col,nro)
	return 1
#hdu = fits.open(pathImagenes+'\\'+imagen).info()
def graficarPicos(dirImg, imagen, cantEspectros):
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
	#plt.show()  #al final de todos los graficos se realiza
	
	return len(peaks) == cantEspectros

def getDatos(plateN, nomObject):
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
##
def obtenerLista(directorio):
    listaArchivos = []
    formato = '.fits'
    for dirname, _, filenames in os.walk(directorio):
        for filename in filenames:
            if(formato in os.path.join(filename)):
                listaArchivos.append(os.path.join(filename))
    return listaArchivos
##
def hola():
	print ('hola')
	return "soy"
