import axios from "axios"

const apiClient = axios.create({
  baseURL: `API URL`,
  headers: {
    "Api-Version": "1.0",
  },
})

export default apiClient
