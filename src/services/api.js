import axios from 'axios';

const api = axios.create({
  // baseURL: 'http://177.75.191.66:3333', // external connection
  // baseURL: 'http://172.31.255.2:3333', // internal connection
  baseURL: 'http://10.0.2.2:3333/', // localhost connection
});

export default api;
