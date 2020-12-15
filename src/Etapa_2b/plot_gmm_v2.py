# %%
import sys
#import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import Recursos
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
from scipy import linalg
from sklearn import mixture
from astropy.io import fits

dirImg = "f:\\GITHUB_TRABAJOS\\proyecto_astro_PPS\\notebooks\\fits"
#nombreImg = 'A4516-TetaMus.fits'
nombreImg = 'C1265-HD136488.fits'
image_data = Recursos.obtenerDatos(dirImg,nombreImg)
image_data_norm = Recursos.normalize_MinMax_2d(image_data)

num_clusters = (fits.getheader(dirImg+'\\'+nombreImg, ignore_missing_end=True))['SPEC-AMO']
max_iterations = 10
tolerance = 0.001

print('clusters esperados: '+str(num_clusters))
plt.imshow(image_data)

#%%
#imagen sin normalizar
hist, bin_edges = np.histogram(image_data, bins=60)
bin_centers = 0.5*(bin_edges[:-1] + bin_edges[1:])
plt.plot(bin_centers, hist, lw=2)

# %%
#imagen normalizada
hist, bin_edges = np.histogram(image_data_norm, bins=60)
bin_centers = 0.5*(bin_edges[:-1] + bin_edges[1:])
plt.plot(bin_centers, hist, lw=2)

# %%
from scipy import ndimage

binary_image = image_data_norm > 0.5
open_image = ndimage.binary_opening(binary_image)
#%%
plt.imshow(binary_image)
#%%
plt.imshow(open_image)
#%%
close_image = ndimage.binary_closing(open_image)
plt.imshow(close_image)
#%%
##parte 2
from scipy import ndimage

binary_image = image_data_norm < 0.05
open_image = ndimage.binary_opening(binary_image)
#%%
plt.imshow(binary_image, cmap=plt.cm.gray)
#%%
plt.imshow(open_image, cmap=plt.cm.gray)
#%%
close_image = ndimage.binary_closing(open_image)

#%%
plt.imshow(close_image, cmap=plt.cm.gray)
cs = plt.contour(close_image, [0.5], linewidths=1.5, colors='r')
#plt.clabel(cs, inline=1, fontsize=10)
#%%
