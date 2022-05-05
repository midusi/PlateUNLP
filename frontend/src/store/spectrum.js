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
    autoSaveValues: async(bboxArr,dataArr,path,imgName) => {
      try {
        await apiSpectrum.autoSave({
          path_dir: path,
          data_arr: [dataArr],
          bbox_arr: [bboxArr],
          img_name: imgName
        })
      } catch (error) {
        console.log(error);
      }
    }
    ,
    generateFits: async (bboxArr,dataArr, path, imgName, fields) => {
      update((prev) => {
        prev.stateGeneratingFits.loading = true
        return prev
      })
      loadingAlert('Guardando...')
      try {
        await apiSpectrum.generatefits({
          path_dir: path,
          data_arr: [dataArr],
          bbox_arr: [bboxArr],
          img_name: imgName,
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
