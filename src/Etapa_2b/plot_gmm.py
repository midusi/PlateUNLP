# %%
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import Recursos

import numpy as np
from scipy import linalg
import matplotlib.pyplot as plt
import matplotlib as mpl
from sklearn import mixture
import matplotlib.image as mpimg
from astropy.io import fits

dirImg = "f:\\GITHUB_TRABAJOS\\proyecto_astro_PPS\\notebooks\\fits"
#nombreImg = 'A4516-TetaMus.fits'
nombreImg = 'C1265-HD136488.fits'
image_data = Recursos.obtenerDatos(dirImg,nombreImg)
num_clusters = (fits.getheader(dirImg+'\\'+nombreImg, ignore_missing_end=True))['SPEC-AMO']
max_iterations = 50
tolerance = 0.001
"""plt.title('Imagen sin normalizar')
plt.imshow(image_data)
plt.colorbar()"""

points = Recursos.normalize_MinMax_2d(image_data)
print('clusters esperados: '+str(num_clusters))
#%%
gmm = mixture.GaussianMixture(n_components=num_clusters, 
            covariance_type='full', tol=tolerance,
            n_init=max_iterations, init_params='kmeans')

# Estimate Model (params='wmc'). Calculate, w=weights, m=mean, c=covars
gmm.fit(points)

# Predict Cluster of each point
label_cluster_points = gmm.predict(points)

means_clusters = gmm.means_
probability_clusters = gmm.weights_
covars_matrix_clusters = gmm.covars_

# %%
