import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // <--el puerto depende del que use el backend
});

export default api;
