import axios from "axios";

const API_URL = "http://localhost:3000/api/auth";

// Iniciar sesión
export const loginUser = async (data) => {
  const res = await axios.post(`${API_URL}/login`, data);
  return res.data; 
};

// Registrar usuario
export const registerUser = async (data) => {
  const res = await axios.post(`${API_URL}/register`, data);
  return res.data;
};

// Recuperar contraseña 
export const recuperarPassword = async (data) => {
  const res = await axios.post(`${API_URL}/recuperar`, data);
  return res.data;
};


