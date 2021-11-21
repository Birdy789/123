

import axios from 'axios'

var instance = axios.create({
  baseURL: 'http://localhost:8081'
})

export default instance
