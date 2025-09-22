// api/axiosConfig.js
import axios from 'axios';

// Configuración base de la API
const getApiBaseUrl = () => {
    if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }
    return 'http://localhost:8081/api';
};

// Crear instancia de axios
const apiClient = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 10000, // 10 segundos
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para requests (opcional - para agregar tokens, etc.)
apiClient.interceptors.request.use(
    (config) => {
        // Aquí puedes agregar tokens de autenticación si los necesitas
        // const token = localStorage.getItem('authToken');
        // if (token) {
        //     config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para responses (manejo centralizado de errores)
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Manejo centralizado de errores HTTP
        let errorMessage = 'Error desconocido';

        if (error.response) {
            // El servidor respondió con un código de error
            errorMessage = error.response.data || `Error HTTP: ${error.response.status}`;
        } else if (error.request) {
            // La petición se hizo pero no hubo respuesta
            errorMessage = 'Error de conexión. Verifique su conexión a internet.';
        } else {
            // Error en la configuración de la petición
            errorMessage = error.message;
        }

        // Puedes agregar logging aquí si lo necesitas
        console.error('API Error:', error);

        // Modificar el error para que tenga un mensaje consistente
        error.message = errorMessage;
        return Promise.reject(error);
    }
);

export default apiClient;