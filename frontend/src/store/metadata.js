import { writable } from 'svelte/store'
import { loadingAlert, errorAlert, showAlert } from '../helpers/Alert'
import apiSpectrum from '../api/spectrum'
import { getMetadataFields } from '../helpers/metadataUtilities'

function createStoreMetadata() {
  const { subscribe, update, set } = writable({
    spectraData: [],
    formActions: undefined,
    fields: {}
  })

  return {
    subscribe,
    set,
    initFields: () => {
      const fields = getMetadataFields()
      const labelFormat = {}
      Object.keys(fields).map((field) => {
        labelFormat[fields[field].label] = fields[field]
      })
      update((prev) => {
        prev.fields = labelFormat
        return prev
      })
    },
    setRemoteMetadata: async (metadataSend, index) => {
      // Receive all fields of a spectrum to be modified
      loadingAlert()
      try {
        const response = await apiSpectrum.getMetadata(metadataSend)
        const { data } = response
        update((prev) => {
          Object.keys(data.metadata).map((field) => {
            prev.spectraData[index][field] = data.metadata[field]
          })
          return prev
        })
        showAlert({ title: 'Metadatos Cargados', message: 'Los metadatos se cargaron exitosamente.' })
        return true
      } catch (error) {
        errorAlert({ message: error.response.data.message })
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
    }
  }
}

export const metadataStore = createStoreMetadata()
