import { axiosApi } from './axios'

const paths = {
  allPaths: '/allPaths',
  getImg: '/image/load',
  saveConfig: '/saveConfig',
  loadConfig: '/loadConfig',
  getResource: '/api/resources/'
}

export default {
  allPaths: async (data) => axiosApi.get(paths.allPaths, {
    params: data
  }),
  getImg: async (data) => axiosApi.get(paths.getImg, {
    params: data
  }),
  saveConfig: async (data) => axiosApi.post(paths.saveConfig, data),
  loadConfig: async () => axiosApi.get(paths.loadConfig),
  getResource: async (data) => axiosApi.get(paths.getResource, {
    params: data
  })
}
