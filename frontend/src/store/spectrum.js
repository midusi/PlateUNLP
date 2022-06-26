import { writable } from 'svelte/store'
import apiSpectrum from '../api/spectrum'
import {
  loadingAlert, errorAlert, showAlert, closeAlert
} from '../helpers/Alert'
import {serverUp} from './serverUp'

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
      loadingAlert("Detectando Espectros...")
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
        if(await serverUp())
          errorAlert()
      }
      update((prev) => {
        prev.state.loading = false
        return prev
      })
    },
    autoSaveValues: async(bboxArr,dataArr,plateData,path,imgName,fields) => {
      let resp;
      if (bboxArr.length === 0){
        try{
          resp = await apiSpectrum.delete({
            img_name: imgName
          })
        }
        catch (error) {
          serverUp()
        }
        return (resp.status === 201);
      }
      else{
        try {
          resp = await apiSpectrum.autoSave({
            path_dir: path,
            data_arr: dataArr,
            bbox_arr: bboxArr,
            plate_data: plateData,
            img_name: imgName,
            fields
          })
        } catch (error) {
          serverUp()
        }
          return (resp.status === 201);
      }
    }
    ,
    generateFits: async (bboxArr,dataArr,plateData, path, imgName, fields) => {
      update((prev) => {
        prev.stateGeneratingFits.loading = true
        return prev
      })
      loadingAlert('Guardando...')
      try {
        await apiSpectrum.generatefits({
          path_dir: path,
          data_arr: dataArr,
          bbox_arr: bboxArr,
          img_name: imgName,
          plate_data: plateData,
          fields
        })
      } catch (error) {
        update((prev) => {
          prev.stateGeneratingFits.error = error
          return prev
        })
        await serverUp()
        return 0
      }
      update((prev) => {
        prev.stateGeneratingFits.loading = false
        return prev
      })
      return 1
    }
  }
}

export const spectrogramStore = createStoreSpectrogram()
