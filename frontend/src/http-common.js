import axios from "axios";
import keycloak from "./auth/keycloak";


const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8081";

console.log("API Base URL:", baseURL);

const api = axios.create({
    baseURL: baseURL,
    headers: {
        "Content-Type": "application/json"
    }
});

api.interceptors.request.use(async (config) => {
    if (keycloak.authenticated) {
        await keycloak.updateToken(30);
        config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;