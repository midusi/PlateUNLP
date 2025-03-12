import { writable } from 'svelte/store'
import apiSpectrum from '../api/spectrum'
import {
  loadingAlert, errorAlert, showAlert, closeAlert
} from '../helpers/Alert'
import { serverUp } from './serverUp'

function createStoreSpectrogram() {
  const { subscribe, update } = writable({
    state: {
      loading: true,
      error: false
    },
    stateGeneratingFits: {
      loading: false,
      error: false
    },
    predictions: []
  })

  return {
    subscribe,
    getPredictions: async (spectrogramCanvas, pathDir, imageName) => {
      loadingAlert('Detectando Espectros...')
      try {
        const response = await apiSpectrum.predict({
          img_path: pathDir,
          img_name: imageName
        })
        const { data } = response
        // graph the predicted bboxes
        spectrogramCanvas.setPredictions(data.predictions)

        update((prev) => {
          prev.predictions = data.predictions
          return prev
        })
        closeAlert()
      } catch (error) {
        update((prev) => {
          prev.state.error = error
          return prev
        })
        if (await serverUp())
          errorAlert()
      }
      update((prev) => {
        prev.state.loading = false
        return prev
      })
    },
    autoSaveValues: async (bboxArr, dataArr, plateData, path, imgName, invertImage) => {
      let resp
      try {
        resp = await apiSpectrum.autoSave({
          path_dir: path,
          data_arr: dataArr,
          bbox_arr: bboxArr,
          plate_data: plateData,
          img_name: imgName
        })
      } catch (error) {
        serverUp()
      }
    },
    generateFits: async (bboxArr, dataArr, plateData, path, imgName, fields, invertImage) => {
      update((prev) => {
        prev.stateGeneratingFits.loading = true
        return prev
      })
      loadingAlert('Guardando...')
      let response
      try {
        response = await apiSpectrum.generatefits({
          path_dir: path,
          data_arr: dataArr,
          bbox_arr: bboxArr,
          img_name: imgName,
          plate_data: plateData,
          fields,
          invert_image: invertImage
        })
      } catch (error) {
        update((prev) => {
          prev.stateGeneratingFits.error = error
          return prev
        })
        await serverUp()
        return response.data
      }
      update((prev) => {
        prev.stateGeneratingFits.loading = false
        return prev
      })
      return response.data
    }
  }
}

export const spectrogramStore = createStoreSpectrogram()
