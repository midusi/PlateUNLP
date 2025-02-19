import { writable } from 'svelte/store'
import apiWorkspace from '../api/workspace'
import { spectrogramStore } from './spectrum'
import {
  loadingAlert, errorAlert, closeAlert, showAlert, serverAlert
} from '../helpers/Alert'
import { serverUp } from './serverUp'

function createStoreWorkspace() {
  const { subscribe, update } = writable({
    state: {
      loading: true,
      error: false
    },
    paths: [],
    imageProperties: {}
  })

  return {
    subscribe,
    getPaths: async (dirPath) => {
      loadingAlert()
      let response
      try {
        response = await apiWorkspace.allPaths({
          path_dir: dirPath
        })
        update((prev) => {
          prev.paths = response.data.paths
          return prev
        })
        closeAlert()
      } catch (error) {
        update((prev) => {
          prev.state.error = error
          return prev
        })
        if (await serverUp()) errorAlert({ message: error.response.data.message })
      }
      update((prev) => {
        prev.state.loading = false
        return prev
      })
    },
    setPath: (fileName, cantSpectra) => {
      update((prev) => {
        prev.paths = prev.paths.map((file) => {
          if (file.fileName === fileName) file.number_of_spectra = cantSpectra
          return file
        })
        return prev
      })
    },
    getImg: async (spectrogramCanvas, dirPath, imgName, params = { rotateImage: false }) => {
      loadingAlert('Cargando imagen...')
      let data
      try {
        const response = await apiWorkspace.getImg({
          dir_path: dirPath,
          img_name: imgName,
          rotate_image: params.rotateImage
        })

        data = response.data

        spectrogramCanvas.loadImage(`data:image/png;base64,${data.image}`, data.info.width, data.info.heigth)
        // && data.info.bboxes.length !== 0 [PREDICCIONES]
        if (data.info.bboxes)
          // no predigo nada y cargo las bboxes
          spectrogramCanvas.loadBboxYoloFormatJson(data.info.bboxes, data.info.metadata)
        else await spectrogramStore.getPredictions(
          spectrogramCanvas,
          dirPath,
          imgName
        )

        update((prev) => {
          prev.imageProperties = data.info
          return prev
        })
        closeAlert()
      } catch (error) {
        update((prev) => {
          prev.state.error = error
          return prev
        })
        if (await serverUp()) errorAlert()
      }

      update((prev) => {
        prev.state.loading = false
        return prev
      })
      return data.info
    },
    saveConfig: async (config) => {
      loadingAlert()
      try {
        await apiWorkspace.saveConfig({
          config
        })
        showAlert({ title: 'Configuración Guardada' })
      } catch (error) {
        errorAlert()
      }
    },
    loadConfig: async () => {
      try {
        const response = await apiWorkspace.loadConfig()
        if (Object.keys(response.data).length !== 0) {
          closeAlert()
          showAlert({ title: 'Conexion establecida' })
          return response.data.config
        }
        return response
      } catch (error) {
        closeAlert()
        await serverAlert()
        return {}
      }
    }
  }
}

export const workspaceStore = createStoreWorkspace()
