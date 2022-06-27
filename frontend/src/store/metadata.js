import { writable } from 'svelte/store'
import { loadingAlert, remoteErrorAlert, showAlert } from '../helpers/Alert'
import apiSpectrum from '../api/spectrum'
import { getMetadataFields } from '../helpers/metadataUtilities'
import {serverUp} from './serverUp'

function createStoreMetadata() {
  const { subscribe, update, set } = writable({
    spectraData: [],
    plateData: {},
    formActions: undefined,
    fields: {},
    globalFields: {}
  })

  return {
    subscribe,
    set,
    initFields: () => {
      const fields = getMetadataFields()
      const labelFormat = {}
      const labelFormatGlobal = {}
      Object.keys(fields).map((field) => {
        labelFormat[fields[field].label] = fields[field]
      })
      update((prev) => {
        prev.fields = labelFormat
        return prev
      })
    },
    setRemoteFields: (fields) => {

       update((prev) => {
        Object.keys(fields).map((field) => {
          prev.fields[field] = fields[field]
        })
        return prev
      })
    }
    ,
    setRemoteMetadata: async (metadataSend, index) => {
      // Receive all fields of a spectrum to be modified
      loadingAlert()
      try {
        const response = await apiSpectrum.getMetadata(metadataSend)
        const { data } = response
        update((prev) => {
          prev.spectraData[index]["loaded"] = []
          Object.keys(data.metadata).map((field) => {
            prev.spectraData[index][field] = data.metadata[field]
            prev.spectraData[index]["loaded"].push(field)
          })
          return prev
        })
        showAlert({ title: 'Metadatos Cargados exitosamente'})
        return true
      } catch (error) {
        if(await serverUp()){
          return await remoteErrorAlert({ message: error.response.data.message})
        }
      }
      return false
    },
    initFormActions: (actions) => {
      update((prev) => {
        prev.formActions = actions
        return prev
      })
    },
    setSpectraData: (data) => {
      update((prev) => {
        prev.spectraData = data
        return prev
      })
    },
    setPlateData: (data) => {
      update((prev) => {
        prev.plateData = data
        return prev
      })
    },
    addOptionObservat: (key, data) => {
      update((prev) => {
        prev.fields[key].options = [data, ...prev.fields[key].options]
        return prev
      })
    },
    setOption: (key, options) => {
      update((prev) => {
        prev.fields[key].options = options
        return prev
      })
    },
    updateDefaults: () => {
      update((prev) => {
        let fields = getMetadataFields();
        let newFields =  {}
        Object.keys(fields).map((field) => {
          newFields[fields[field].label] = fields[field]
        })
        let oldFields = prev.fields;
        Object.keys(prev.fields).map((field) => {
          if(oldFields[field].default != undefined){
            oldFields[field].options = newFields[field].options
            oldFields[field].default = newFields[field].default
          }
      })
       return prev
    })
    }
  }
}

export const metadataStore = createStoreMetadata()
