import axios from 'axios';

// Determine the base URL based on the environment
// In development, it will use the VITE_API_URL from the .env file.
// In production, it will use the same origin as the frontend.
const baseURL = import.meta.env.PROD 
  ? '/api' 
  : import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: baseURL,
});

// You can add interceptors here if needed
// ...

export default api;