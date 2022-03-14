import axios from 'axios'

export const axiosApi = axios.create({
  baseURL: `http://${window.location.hostname}:20500/api`,
  headers: {
    'Content-type': 'application/json'
  }
})
