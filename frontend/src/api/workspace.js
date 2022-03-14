import { axiosApi } from './axios'

const paths = {
  allPaths: '/allPaths',
  getImg: '/getImg',
  saveConfig: '/saveConfig',
  loadConfig: '/loadConfig'
}

export default {
  allPaths: async (data) => axiosApi.get(paths.allPaths, {
    params: data
  }),
  getImg: async (data) => axiosApi.get(paths.getImg, {
    params: data
  }),
  saveConfig: async (data) => axiosApi.post(paths.saveConfig, data),
  loadConfig: async () => axiosApi.get(paths.loadConfig)
}
