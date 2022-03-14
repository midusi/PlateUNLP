import { axiosApi } from './axios'

const paths = {
  predic: '/predict',
  generatefits: '/generatefits',
  getMetadata: '/getMetadata'
}

export default {
  predict: async (data) => axiosApi.post(paths.predic, data),
  generatefits: async (data) => axiosApi.post(paths.generatefits, data),
  getMetadata: async (data) => axiosApi.post(paths.getMetadata, data)
}
