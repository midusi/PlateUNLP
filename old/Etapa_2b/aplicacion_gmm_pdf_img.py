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
import scipy.stats as stats

#Procesamiento
from sklearn.mixture import GaussianMixture

#Configuración warnings
import warnings
warnings.filterwarnings('ignore')

#Variables para obtener la información de la ubicación de la imagen
#CAMBIAR POR UNA FUNCION QUE OBTENGA EL DIRECTORIO POR DEFAULT
DIRECTORIO_IMG = "f:\\GITHUB_TRABAJOS\\proyecto_astro_PPS\\notebooks\\fits"
NOMBRE_IMG = 'A4762-HD166734.fits' #posee un espectro celeste

datosImg = np.sum(Recursos.normalize_MinMax_2d(np.array( fits.getdata(DIRECTORIO_IMG+'\\'+NOMBRE_IMG, ignore_missing_end=True))), axis= 0)
numClusters = np.int((fits.getheader(DIRECTORIO_IMG+'\\'+NOMBRE_IMG, ignore_missing_end=True))['SPEC-AMO'])

#%%
#Variables para la aplicación de GMM
#Se obtiene la información de la cantidad de espectros presentes en la imagen cuya información está identificado en la metadata
def modelo_gmm(datos, clusters, nro_iters):
    #Se configura el modelo
    gmm = GaussianMixture(
            n_components=clusters,   #agregar cantidad total: *3
            covariance_type='full', 
            n_init= nro_iters)
    #datosNormImg.shape = (datosNormImg.shape[0],1)
    
    #Se estima el modelo
    gmm.fit(datos)
    #Se predice el cluster para cada punto de la imagen
    #etiquetasClusters = gmm.predict(datosNormImg)
    print("Datos del modelo")
    print("centroides")
    print(gmm.means_)
    print("%")
    print(gmm.weights_)
    print("std")
    print(np.sqrt(gmm.covariances_))
    return gmm

def plot_gauss(datos, means, weigths, covars):
    fig, ax = plt.subplots()
    ax.plot(datos)
    ax.hlines(means,[0], datos.size, lw=1)
    
    x = datos.copy().ravel()
    x.sort()
    ax.plot(x,weigths[0]*stats.norm.pdf(x,means[0],np.sqrt(covars[0])).ravel(), c='red')
    plt.show()


def graficar(data, mu, std):
    # Plot the histogram.
    #plt.hist(data, bins=25, density=True, alpha=0.6, color='g')
    plt.plot(data)

    # Plot the PDF.
    xmin, xmax = plt.xlim()
    x = np.linspace(xmin, xmax, 100)
    p = norm.pdf(x, mu, std)
    plt.plot(x, p, 'k', linewidth=2)
    title = "Fit results: mu = %.2f,  std = %.2f" % (mu, std)
    plt.title(title)


#%%
gmm = modelo_gmm(datosImg.reshape(-1,1), np.int(1), 150)
#%%
#plot_gauss(datosImg,gmm.means_,gmm.weights_,gmm.covariances_)
graficar(datosImg(1,-1),gmm.means_[0],np.sqrt(gmm.covariances_[0]))


#%%
eje =np.arange(0, datosImg.size)
#print(datosImg.shape)

y = stats.norm(gmm.means_, np.sqrt(gmm.covariances_)).pdf(datosImg.ravel())
plt.plot(eje, y)
#%%
import scipy.stats as stats
f_axis = datosImg.copy().ravel()
f_axis.sort()
plt.plot(f_axis,gmm.weights_[0]*stats.norm.pdf(f_axis,gmm.means_[0],np.sqrt(gmm.covariances_[0])).ravel(), c='red')

#%%
import cv2
img = fits.getdata(DIRECTORIO_IMG+'\\'+NOMBRE_IMG, ignore_missing_end=True)


gray = cv2.cvtColor(img,cv2.COLOR_BGR2GRAY)
ret, thresh = cv2.threshold(gray,0,255,cv2.THRESH_BINARY_INV+cv2.THRESH_OTSU)

#%%
#import numpy as np
from scipy.stats import norm
#import matplotlib.pyplot as plt


# Generate some data for this demonstration.
data = np.sum(Recursos.normalize_MinMax_2d(np.array( fits.getdata(DIRECTORIO_IMG+'\\'+NOMBRE_IMG, ignore_missing_end=True))), axis= 0)


# Fit a normal distribution to the data:
mu, std = norm.fit(data)

# Plot the histogram.
plt.hist(data, bins=25, density=True, alpha=0.6, color='g')

# Plot the PDF.
xmin, xmax = plt.xlim()
x = np.linspace(xmin, xmax, 100)
p = norm.pdf(x, mu, std)
plt.plot(x, p, 'k', linewidth=2)
title = "Fit results: mu = %.2f,  std = %.2f" % (mu, std)
plt.title(title)


plt.show()
# %%

##extras
#import numpy as np
#import matplotlib.pyplot as plt

# Fixing random state for reproducibility
#np.random.seed(19680801)

# some random data
y = np.sum(Recursos.normalize_MinMax_2d(np.array( fits.getdata(DIRECTORIO_IMG+'\\'+NOMBRE_IMG, ignore_missing_end=True))), axis= 0)
x = np.arange(y.size)


def scatter_hist(x, y, ax, ax_histx, ax_histy):
    # no labels
    ax_histx.tick_params(axis="x", labelbottom=False)
    ax_histy.tick_params(axis="y", labelleft=False)

    # the scatter plot:
    ax.scatter(x, y)

    # now determine nice limits by hand:
    binwidth = 0.25
    xymax = max(np.max(np.abs(x)), np.max(np.abs(y)))
    lim = (int(xymax/binwidth) + 1) * binwidth

    bins = np.arange(-lim, lim + binwidth, binwidth)
    ax_histx.hist(x, bins=bins)
    ax_histy.hist(y, bins=bins, orientation='horizontal')

# definitions for the axes
left, width = 0.1, 0.65
bottom, height = 0.1, 0.65
spacing = 0.005


rect_scatter = [left, bottom, width, height]
rect_histx = [left, bottom + height + spacing, width, 0.2]
rect_histy = [left + width + spacing, bottom, 0.2, height]

# start with a square Figure
fig = plt.figure(figsize=(8, 8))

ax = fig.add_axes(rect_scatter)
ax_histx = fig.add_axes(rect_histx, sharex=ax)
ax_histy = fig.add_axes(rect_histy, sharey=ax)

# use the previously defined function

scatter_hist(x, y, ax, ax_histx, ax_histy)

plt.show()

# %%
