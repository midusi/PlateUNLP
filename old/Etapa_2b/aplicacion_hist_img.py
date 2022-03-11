# %%
#Tratamiento de filesystem
import os
import sys

from numpy.core.records import array
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
#import Recursos

#Tratamientos de datos
import numpy as np
from scipy import linalg
import pandas as pd

#Tratamiento de imagen .fits
from astropy.io import fits

#Gráficos
import matplotlib.pyplot as plt
%matplotlib inline

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

image_data = fits.open(DIRECTORIO_IMG+'\\'+NOMBRE_IMG, ignore_missing_end=True)[0].data
print(type(image_data))
print(image_data.shape)
#%%
image_data = fits.getdata(DIRECTORIO_IMG+'\\'+NOMBRE_IMG, ignore_missing_end=True)
print(type(image_data))
print(image_data.shape)
#%%
print('Min:', np.min(image_data))
print('Max:', np.max(image_data))
print('Mean:', np.mean(image_data))
print('Stdev:', np.st)
#%%
from numpy.core.records import array
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import Recursos

image_data = Recursos.normalize_MinMax_2d(image_data)
plt.imshow(image_data, cmap='gray')
plt.colorbar()

#%%
print(type(image_data.flatten()))
histogram = plt.hist(image_data.flatten(), bins='auto', histtype='bar', density=True )
#%%
fig = plt.figure(figsize=(6,12))
fig.add_subplot(111)

# We plot it in log-scale and add a small number to avoid nan values.
plt.imshow(np.log10(image_data+1E-3), vmin=-1, vmax=1, origin='lower', cmap='gray')
#%%
image_data_flatten = image_data.flatten().reshape(-1,1)
gmm = GaussianMixture(n_components=2, covariance_type='full').fit(image_data_flatten)

print(gmm.means_)
print("convar")
print(np.sqrt(gmm.covariances_))
#%%
#tarda demasiado - se tiene que cortar la ejecucion--> probar en google colab
n_components = np.arange(1, 10)
X = image_data_flatten
clfs = [GaussianMixture(n, max_iter = 500).fit(X) for n in n_components]
bics = [clf.bic(X) for clf in clfs]
aics = [clf.aic(X) for clf in clfs]

plt.plot(n_components, bics, label = 'BIC')
plt.plot(n_components, aics, label = 'AIC')
plt.xlabel('n_components')
plt.legend()
plt.show()
#%%
barprops = dict(aspect='auto', cmap='binary', interpolation='nearest')
plt.imshow(image_data_flatten, **barprops)
#%%
