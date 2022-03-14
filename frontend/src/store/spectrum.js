import { writable } from 'svelte/store'
import apiSpectrum from '../api/spectrum'
import {
  loadingAlert, errorAlert, showAlert, closeAlert
} from '../helpers/Alert'

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
      loadingAlert()
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
        errorAlert()
      }
      update((prev) => {
        prev.state.loading = false
        return prev
      })
    },
    generateFits: async (bboxArr, pathArr, imgArr, fields) => {
      update((prev) => {
        prev.stateGeneratingFits.loading = true
        return prev
      })
      loadingAlert('Guardando...')
      try {
        await apiSpectrum.generatefits({
          path_dir: pathArr,
          bbox_arr: [bboxArr],
          img_name: imgArr,
          fields
        })
        showAlert({ title: 'Guardado', message: 'Se guardo con éxito.' })
      } catch (error) {
        update((prev) => {
          prev.stateGeneratingFits.error = error
          return prev
        })
        errorAlert()
      }
      update((prev) => {
        prev.stateGeneratingFits.loading = false
        return prev
      })
    }
  }
}

export const spectrogramStore = createStoreSpectrogram()
