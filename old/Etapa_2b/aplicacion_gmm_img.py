# %%
#Tratamiento de filesystem
import os
import sys
from astropy.utils import data

from numpy.core.records import array
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import Recursos

#Tratamientos de datos
import numpy as np
from scipy import linalg
import pandas as pd

#Tratamiento de imagen .fits
from astropy.io import fits

#Gráficos
import matplotlib.pyplot as plt
import matplotlib as mpl
import matplotlib.image as mpimg

#Procesamiento
from sklearn.mixture import GaussianMixture

#Configuración warnings
import warnings
warnings.filterwarnings('ignore')

#Variables para obtener la información de la ubicación de la imagen
#CAMBIAR POR UNA FUNCION QUE OBTENGA EL DIRECTORIO POR DEFAULT
DIRECTORIO_IMG = "f:\\GITHUB_TRABAJOS\\proyecto_astro_PPS\\notebooks\\fits"
NOMBRE_IMG = 'C1265-HD136488.fits'
#op2 'A4516-TetaMus.fits'
#datosImg = Recursos.obtenerDatos(DIRECTORIO_IMG,NOMBRE_IMG)

#Variables para la aplicación de GMM
#Se obtiene la información de la cantidad de espectros presentes en la imagen cuya información está identificado en la metadata
numClusters = (fits.getheader(DIRECTORIO_IMG+'\\'+NOMBRE_IMG, ignore_missing_end=True))['SPEC-AMO']
ITER_MAX = 125

datosImg = fits.getdata(DIRECTORIO_IMG+'\\'+NOMBRE_IMG, ignore_missing_end=True)

#no se normaliza los valores de los datos (sumarizados) de la imagen - edit
#datosNormImg = Recursos.sumarizarPixels(Recursos.normalize_MinMax_2d(datosImg))

print("shape")
print(datosImg)
plt.imshow(datosImg)

#%%
print("sum")
plt.plot( np.sum(datosImg, axis=1))
#%%
print("sum2 axis 0")
plt.plot( np.sum(Recursos.normalize_MinMax_2d(datosImg), axis=0))
#%%
datosImg = fits.getdata(DIRECTORIO_IMG+'\\'+NOMBRE_IMG, ignore_missing_end=True)

info = np.sum(Recursos.normalize_MinMax_2d(datosImg), axis=0)
#Se configura el modelo
gmm = GaussianMixture(
        n_components=2,   #agregar cantidad total
        covariance_type='full', 
        n_init=ITER_MAX)

#datosNormImg.shape = (datosNormImg.shape[0],1)
#old_shape = datosNormImg.shape
#Se estima el modelo
gmm.fit(np.array( info.reshape(-1,1)))

#Se predice el cluster para cada punto de la imagen
#etiquetasClusters = gmm.predict(datosNormImg)

#Se extrae resultados del modelo
meansClusters = gmm.means_
probabalidadesClusters = gmm.weights_
matrixCovaranciasClusters = gmm.covariances_

print("clusters")
print(meansClusters)
print("%")
print(probabalidadesClusters)
print("matriz de covariancias")
print(matrixCovaranciasClusters)
print("covariancias")
print(np.sqrt(gmm.covariances_))
#%%
import scipy.stats as stats
f_axis = info.copy().ravel()
f_axis.sort()
plt.plot(f_axis,probabalidadesClusters[0]*stats.norm.pdf(f_axis,meansClusters[0],np.sqrt(matrixCovaranciasClusters[0])).ravel(), c='red')

#%%
fig, (vax, hax) = plt.subplots(1, 2, figsize=(12, 6))
vax.plot(info)
t=np.arange(0.0, info.size)

vax.hlines(meansClusters,[0], info.size, lw=2)
plt.show()


#Recursos.graficarResultadosConValores(datosImg,NOMBRE_IMG,datosNormImg,meansClusters)

#%%
fig, ax = plt.subplots()
ax.plot(datosNormImg, linewidth=1, color='red')
ax.axvline(x= meansClusters[0], color='black', linestyle='-.', linewidth=1)
ax.axvline(x= meansClusters[1], color='black', linestyle='--', linewidth=1)
plt.show()

#%%
# generate some random data to work with
np.random.seed(2)
x1 = datosNormImg


plt.hist(x1, bins = 80, normed = True, alpha = 0.6)
#plt.xlim(-10, 20)
# %%
from scipy.stats import norm, multivariate_normal
# estimate the mean and variance of the data
x1_mean, x1_var = np.mean(x1), np.var(x1)
#x2_mean, x2_var = np.mean(x2), np.var(x2)
#x_mean = [x1_mean, x2_mean]
#x_var = [x1_var, x2_var]

def plot_guassian(x_mean, x_var):
    """
    note that scipy's normal distribution requires the
    standard deviation (square root of variance) 
    instead of the variance
    """
    x = np.linspace(start = x1.min() , stop = x1.max(),num=80)
  
    y = norm(x1_mean, np.sqrt(x1_var)).pdf(x)
    plt.plot(x1, y)

#plot_hist(data)
plt.hist(x1, bins = 80, normed = True, alpha = 0.6)

plot_guassian(x1_mean, x1_var)
#%%
mu_1 = 2.0
srd_1 = 4.0

mu_2 = 10.0
srd_2 = 1.0

new_data = np.random.randn(50000)
data_1 = new_data * srd_1 + mu_1

new_data = np.random.randn(50000)
data_2 = new_data * srd_2 + mu_2

new_data = np.concatenate((data_1, data_2), axis=0)

new_data = new_data.reshape(-1, 1)

hx, hy, _ = plt.hist(new_data, bins=100, density=1,color="lightblue")

plt.title('Gaussian mixture example 02')
plt.grid()

plt.savefig("example_gmm_02.png", bbox_inches='tight')
plt.show()
gmm_ej = GaussianMixture(n_components=2, max_iter=1000, covariance_type='full').fit(new_data)

print('means')
print(gmm_ej.means_)
#print(gmm_ej.covariances_)
print('std')
print(np.sqrt(gmm_ej.covariances_))
