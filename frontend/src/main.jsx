import React from "react";
import ReactDOM from "react-dom/client";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import keycloak from "./auth/keycloak.js";
import App from "./App";
import "./index.css";

// Configuración de inicialización de Keycloak
const initOptions = {
    onLoad: 'login-required', // Redirige automáticamente al login
    checkLoginIframe: false,  // Desactiva iframe para evitar problemas
    // Opcional: puedes usar 'check-sso' en lugar de 'login-required'
    // si quieres verificar si hay una sesión sin forzar login
};

ReactDOM.createRoot(document.getElementById('root')).render(
    <ReactKeycloakProvider
        authClient={keycloak}
        initOptions={initOptions}
        onEvent={(event, error) => {
            console.log('Keycloak event:', event, error);
        }}
        onTokens={(tokens) => {
            console.log('Keycloak tokens:', tokens);
        }}
    >
        <App />
    </ReactKeycloakProvider>
)