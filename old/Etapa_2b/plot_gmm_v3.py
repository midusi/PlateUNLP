# %%
import os
import sys
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
#plt.imshow(image_data)

#%%
hist, bin_edges = np.histogram(image_data_norm, bins=60)
bin_centers = 0.5*(bin_edges[:-1] + bin_edges[1:])
plt.plot(bin_centers, hist, lw=2)
classif = mixture.GaussianMixture(n_components=num_clusters)
classif.fit(image_data_norm.reshape((image_data_norm.size, 1)))

threshold = np.mean(classif.means_)
binary_img = image_data_norm > threshold

plt.figure(figsize=(11,4))

plt.subplot(131)
plt.imshow(image_data_norm, cmap=plt.cm.gray)
plt.axis('off')
plt.subplot(132)
plt.plot(bin_centers, hist, lw=2)
plt.axvline(threshold, color='r', ls='--', lw=2)
plt.axvline(classif.means_[0], color='g', ls='--', lw=1)
plt.axvline(classif.means_[1], color='g', ls='--', lw=1)

plt.text(0.57, 0.8, 'Umbral', fontsize=20, transform = plt.gca().transAxes)
plt.yticks([])
plt.subplot(133)
plt.imshow(binary_img, cmap=plt.cm.gray, interpolation='nearest')
plt.axis('off')

plt.subplots_adjust(wspace=0.02, hspace=0.3, top=1, bottom=0.1, left=0, right=1)
plt.show()

#%%
from scipy.stats import norm, multivariate_normal
import matplotlib as mpl
import itertools

color_iter = itertools.cycle(['navy', 'c', 'cornflowerblue', 'gold',
                              'darkorange'])
def plot_contours(data, means, covs, title):
    """visualize the gaussian components over the data"""
    plt.figure()
    plt.plot(data[:, 0], data[:, 1], 'ko')

    delta = 0.025
    k = means.shape[0]
    x = np.arange(-2.0, 7.0, delta)
    y = np.arange(-2.0, 7.0, delta)
    x_grid, y_grid = np.meshgrid(x, y)
    coordinates = np.array([x_grid.ravel(), y_grid.ravel()]).T

    col = ['green', 'red', 'indigo']
    for i in range(k):
        mean = means[i]
        cov = covs[i]
        z_grid = multivariate_normal(mean, cov).pdf(coordinates).reshape(x_grid.shape)
        plt.contour(x_grid, y_grid, z_grid, colors = col[i])

    plt.title(title)
    plt.tight_layout()

def plot_results(X, Y_, means, covariances, index, title):
    splot = plt.subplot(2, 1, 1 + index)
    for i, (mean, covar, color) in enumerate(zip(
            means, covariances, color_iter)):
        v, w = linalg.eigh(covar)
        v = 2. * np.sqrt(2.) * np.sqrt(v)
        u = w[0] / linalg.norm(w[0])
        # as the DP will not use every component it has access to
        # unless it needs it, we shouldn't plot the redundant
        # components.
        if not np.any(Y_ == i):
            continue
        plt.scatter(X[Y_ == i, 0], X[Y_ == i, 1], .8, color=color)

        # Plot an ellipse to show the Gaussian component
        angle = np.arctan(u[1] / u[0])
        angle = 180. * angle / np.pi  # convert to degrees
        ell = mpl.patches.Ellipse(mean, v[0], v[1], 180. + angle, color=color)
        ell.set_clip_box(splot.bbox)
        ell.set_alpha(0.5)
        splot.add_artist(ell)

    plt.xlim(-9., 5.)
    plt.ylim(-3., 6.)
    plt.xticks(())
    plt.yticks(())
    plt.title(title)

print('converged?:', classif.converged_)
#plt.imshow(image_data_norm)
#plot_contours(image_data_norm, classif.means_, classif.covariances_, 'Final clusters')
plot_results(image_data_norm.reshape((image_data_norm.size, 1)), classif.predict(image_data_norm.reshape((image_data_norm.size, 1))), classif.means_, classif.covariances_, 0, 'Gaussian Mixture')

# %%
#parte 3
spectro_data_norm = Recursos.normalize_MinMax_1d((Recursos.sumarizarPixels(image_data_norm)))
hist, bin_edges = np.histogram(spectro_data_norm, bins=60)
bin_centers = 0.5*(bin_edges[:-1] + bin_edges[1:])
plt.plot(bin_centers, hist, lw=2)
classif = mixture.GaussianMixture(n_components=num_clusters)
classif.fit(spectro_data_norm.reshape((spectro_data_norm.size, 1)))

threshold = np.mean(classif.means_)
binary_img = spectro_data_norm > threshold

plt.figure(figsize=(11,4))

plt.subplot(131)
plt.plot(spectro_data_norm)
plt.axis('off')
plt.subplot(132)
plt.plot(bin_centers, hist, lw=2)
plt.axvline(threshold, color='r', ls='--', lw=2)
plt.axvline(classif.means_[0], color='g', ls='--', lw=1)
plt.axvline(classif.means_[1], color='g', ls='--', lw=1)

plt.text(0.57, 0.8, 'Umbral', fontsize=20, transform = plt.gca().transAxes)
plt.yticks([])
plt.subplot(133)
plt.plot(binary_img)
plt.axis('off')

plt.subplots_adjust(wspace=0.02, hspace=0.3, top=1, bottom=0.1, left=0, right=1)
plt.show()

#%%
#parte 1b
sm = plt.cm.ScalarMappable(cmap= 'gray', norm=plt.Normalize(vmin=0, vmax=1))
# fake up the array of the scalar mappable. Urgh…
sm._A = []
hist, bin_edges = np.histogram(image_data_norm, bins=60)
bin_centers = 0.5*(bin_edges[:-1] + bin_edges[1:])
plt.plot(bin_centers, hist, lw=2)
plt.colorbar(sm)
#plt.colorbar()
plt.show()
# %%
#parte 4
x_data = image_data_norm
plt.scatter(x_data[:, 0], x_data[:, 1], c='grey', s=10)
plt.axis('equal')
plt.show()

#%%
#por default max_iter = 100
gmm = mixture.GaussianMixture(n_components=num_clusters).fit(image_data_norm)
labels = gmm.predict(image_data_norm)
x_data = image_data_norm
plt.scatter(x_data[:, 0], x_data[:, 1], c=labels, s=40, cmap='viridis');

#%%
##parte 5
from matplotlib.patches import Ellipse
from matplotlib import cm
from matplotlib.colors import ListedColormap, LinearSegmentedColormap
COLORS = ['red', 'blue', 'green', 'yellow', 'gray', 'pink', 'violet', 'brown',
          'cyan', 'magenta']

def plot_ellipse(center, covariance, alpha):
    
    # eigenvalues and eigenvector of matrix covariance
    eigenvalues, eigenvector = np.linalg.eigh(covariance)
    order = eigenvalues.argsort()[::-1]
    eigenvector = eigenvector[:, order]

    # Calculate Angle of ellipse
    angle = np.degrees(np.arctan2(*eigenvector[:, 0][::-1]))

    # Calculate with, height
    width, height = 4 * np.sqrt(eigenvalues[order])

    # Ellipse Object
    ellipse = Ellipse(xy=center, width=width, height=height, angle=angle,
                      alpha=alpha)

    ax = plt.gca()
    ax.add_artist(ellipse)

    return ellipse


def plot_results_v2(points, means_clusters, label_cluster_points,
                 covars_matrix_clusters):
    plt.plot()
    for nc in range(len(means_clusters)):
        # Plot points in cluster
        points_cluster = list()
        for i, p in enumerate(label_cluster_points):
            if p == nc:
                plt.plot(points[i][0], points[i][1], linestyle='None',
                         color=COLORS[nc], marker='.')
                points_cluster.append(points[i])
        # Plot mean
        mean = means_clusters[nc]
        plt.plot(mean[0], mean[1], 'o', markerfacecolor=COLORS[nc],
                 markeredgecolor='k', markersize=10)

        # Plot Ellipse
        plot_ellipse(mean, covars_matrix_clusters[nc], 0.2,)

    plt.show()

plot_results_v2(image_data_norm, gmm.means_, labels, gmm.covariances_)

#%%
import itertools
import matplotlib as mpl
color_iter = itertools.cycle(['k', 'r', 'g', 'b', 'c', 'm', 'y'])
splot = plt.subplot(2, 1, 2)
X = image_data_norm

Y_ = labels
for i, (mean, covar, color) in enumerate(zip(gmm.means_, gmm.covariances_,
                                             color_iter)):
    v, w = linalg.eigh(covar)
    if not np.any(Y_ == i):
        continue
    plt.scatter(X[Y_ == i, 0], X[Y_ == i, 1], .8, color=color)

    # Plot an ellipse to show the Gaussian component
    angle = np.arctan2(w[0][1], w[0][0])
    angle = 180 * angle / np.pi  # convert to degrees
    v *= 4
    ell = mpl.patches.Ellipse(mean, v[0], v[1], 180 + angle, color=color)
    ell.set_clip_box(splot.bbox)
    ell.set_alpha(.5)
    splot.add_artist(ell)
plt.subplots_adjust(hspace=.35, bottom=.02)
plt.show()