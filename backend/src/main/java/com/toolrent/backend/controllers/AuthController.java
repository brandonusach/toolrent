package com.toolrent.backend.controllers;

import com.toolrent.backend.config.KeycloakConfigProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"}, allowCredentials = "true")
public class AuthController {

    @Autowired
    private KeycloakConfigProperties keycloakConfig;

    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ConcurrentHashMap<String, Boolean> processingCallbacks = new ConcurrentHashMap<>();

    /**
     * NUEVO: Procesar callback de Keycloak desde el frontend
     */
    @PostMapping("/callback")
    public ResponseEntity<?> handleCallback(@RequestBody Map<String, String> callbackData,
                                            HttpServletResponse response) {
        try {
            String code = callbackData.get("code");
            String redirectUri = callbackData.get("redirectUri");
            String state = callbackData.get("state");

            if (code == null || code.isEmpty()) {
                return ResponseEntity.badRequest().body("Código de autorización requerido");
            }

            // Evitar procesamiento duplicado
            String callbackKey = code + "_" + System.currentTimeMillis();
            if (processingCallbacks.putIfAbsent(callbackKey, true) != null) {
                return ResponseEntity.badRequest().body("Callback ya en progreso");
            }

            try {
                // Intercambiar código por tokens
                String tokenUrl = keycloakConfig.getTokenUrl();
                if (tokenUrl == null) {
                    return ResponseEntity.status(500).body("Configuración de Keycloak incompleta");
                }

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

                MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                params.add("grant_type", "authorization_code");
                params.add("client_id", keycloakConfig.getResource());
                params.add("code", code);
                params.add("redirect_uri", redirectUri != null ? redirectUri : frontendUrl + "/callback");

                HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
                ResponseEntity<Map> tokenResponse = restTemplate.postForEntity(tokenUrl, request, Map.class);

                if (tokenResponse.getStatusCode().is2xxSuccessful() && tokenResponse.getBody() != null) {
                    Map<String, Object> tokens = tokenResponse.getBody();

                    String accessToken = (String) tokens.get("access_token");
                    String refreshToken = (String) tokens.get("refresh_token");
                    Integer expiresIn = (Integer) tokens.get("expires_in");

                    if (accessToken != null) {
                        // Guardar tokens en cookies
                        setSecureCookie(response, "access_token", accessToken,
                                expiresIn != null ? expiresIn : 3600);
                        if (refreshToken != null) {
                            setSecureCookie(response, "refresh_token", refreshToken, 86400);
                        }

                        // Obtener información del usuario
                        Map<String, Object> userInfo = getUserInfoFromToken(accessToken);

                        Map<String, Object> callbackResponse = new HashMap<>();
                        callbackResponse.put("success", true);
                        callbackResponse.put("user", userInfo);
                        callbackResponse.put("message", "Autenticación exitosa");

                        return ResponseEntity.ok(callbackResponse);
                    }
                }

                return ResponseEntity.badRequest().body("Error intercambiando código por token");

            } finally {
                processingCallbacks.remove(callbackKey);
            }

        } catch (Exception e) {
            System.err.println("Error procesando callback: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error procesando callback: " + e.getMessage());
        }
    }

    /**
     * Obtiene información del usuario autenticado - mejorado para soportar cookies
     */
    @GetMapping("/user-info")
    public ResponseEntity<Map<String, Object>> getUserInfo(HttpServletRequest request) {
        try {
            // Primero intentar obtener de JWT en el contexto de seguridad
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
                Jwt jwt = (Jwt) authentication.getPrincipal();
                return ResponseEntity.ok(formatUserInfoFromJwt(jwt, authentication));
            }

            // Si no hay JWT en contexto, intentar obtener de cookies
            String accessToken = getTokenFromCookies(request, "access_token");
            if (accessToken != null) {
                Map<String, Object> userInfo = getUserInfoFromToken(accessToken);
                if (!userInfo.isEmpty()) {
                    return ResponseEntity.ok(userInfo);
                }
            }

            return ResponseEntity.status(401).body(Map.of("error", "No autenticado"));

        } catch (Exception e) {
            System.err.println("Error obteniendo información del usuario: " + e.getMessage());
            return ResponseEntity.status(401).body(Map.of("error", "Token inválido"));
        }
    }

    /**
     * Obtiene la URL de login de Keycloak
     */
    @GetMapping("/login-url")
    public ResponseEntity<Map<String, String>> getKeycloakLoginUrl() {
        if (!keycloakConfig.isConfigured()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Keycloak no está configurado");
            return ResponseEntity.badRequest().body(error);
        }

        Map<String, String> response = new HashMap<>();
        String loginUrl = String.format("%s?client_id=%s&redirect_uri=%s/callback&response_type=code&scope=openid profile email&state=%s",
                keycloakConfig.getAuthUrl(),
                keycloakConfig.getResource(),
                frontendUrl,
                generateState());

        response.put("loginUrl", loginUrl);
        return ResponseEntity.ok(response);
    }

    /**
     * Información del sistema de autenticación
     */
    @GetMapping("/system-info")
    public ResponseEntity<Map<String, Object>> getSystemInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("keycloakEnabled", keycloakConfig.isConfigured());
        if (keycloakConfig.isConfigured()) {
            info.put("serverUrl", keycloakConfig.getAuthServerUrl());
            info.put("realm", keycloakConfig.getRealm());
            info.put("clientId", keycloakConfig.getResource());
            info.put("authUrl", keycloakConfig.getAuthUrl());
            info.put("logoutUrl", keycloakConfig.getLogoutUrl());
        }
        info.put("version", "2.1.0");
        info.put("authMode", "keycloak");
        return ResponseEntity.ok(info);
    }

    /**
     * Logout mejorado - limpia cookies y devuelve URL de logout
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletResponse response) {
        try {
            // Limpiar cookies
            clearSecureCookie(response, "access_token");
            clearSecureCookie(response, "refresh_token");

            if (!keycloakConfig.isConfigured()) {
                return ResponseEntity.ok(Map.of("message", "Sesión cerrada"));
            }

            String logoutUrl = String.format("%s?redirect_uri=%s",
                    keycloakConfig.getLogoutUrl(),
                    frontendUrl);

            Map<String, String> responseBody = new HashMap<>();
            responseBody.put("logoutUrl", logoutUrl);
            responseBody.put("message", "Sesión cerrada exitosamente");

            return ResponseEntity.ok(responseBody);

        } catch (Exception e) {
            System.err.println("Error en logout: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Error cerrando sesión"));
        }
    }

    /**
     * Valida el token actual
     */
    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateToken(HttpServletRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication != null && authentication.isAuthenticated() &&
                    authentication.getPrincipal() instanceof Jwt) {

                Map<String, Object> response = new HashMap<>();
                response.put("valid", true);
                response.put("authorities", authentication.getAuthorities());
                response.put("username", ((Jwt) authentication.getPrincipal()).getClaimAsString("preferred_username"));
                return ResponseEntity.ok(response);
            }

            // Intentar validar desde cookies
            String accessToken = getTokenFromCookies(request, "access_token");
            if (accessToken != null) {
                Map<String, Object> userInfo = getUserInfoFromToken(accessToken);
                if (!userInfo.isEmpty()) {
                    return ResponseEntity.ok(Map.of("valid", true, "user", userInfo));
                }
            }

            return ResponseEntity.status(401).body(Map.of("valid", false, "message", "Token inválido"));

        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("valid", false, "message", "Error validando token"));
        }
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("keycloak", keycloakConfig.isConfigured() ? "CONFIGURED" : "NOT_CONFIGURED");
        health.put("timestamp", System.currentTimeMillis());

        if (keycloakConfig.isConfigured()) {
            health.put("keycloakServer", keycloakConfig.getAuthServerUrl());
            health.put("realm", keycloakConfig.getRealm());
        }

        return ResponseEntity.ok(health);
    }

    // Métodos auxiliares privados

    private Map<String, Object> formatUserInfoFromJwt(Jwt jwt, Authentication authentication) {
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("username", jwt.getClaimAsString("preferred_username"));
        userInfo.put("email", jwt.getClaimAsString("email"));
        userInfo.put("name", jwt.getClaimAsString("name"));
        userInfo.put("firstName", jwt.getClaimAsString("given_name"));
        userInfo.put("lastName", jwt.getClaimAsString("family_name"));
        userInfo.put("roles", authentication.getAuthorities());

        // Determinar rol principal para el frontend
        userInfo.put("role", extractMainRole(authentication));

        return userInfo;
    }

    private String extractMainRole(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return "USER";
        }

        String roleString = authentication.getAuthorities().toString().toLowerCase();
        if (roleString.contains("administrator") || roleString.contains("admin")) {
            return "ADMINISTRATOR";
        } else if (roleString.contains("employee") || roleString.contains("empleado")) {
            return "EMPLOYEE";
        }
        return "USER";
    }

    private Map<String, Object> getUserInfoFromToken(String accessToken) {
        try {
            String userInfoUrl = keycloakConfig.getUserInfoUrl();
            if (userInfoUrl == null) return new HashMap<>();

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(userInfoUrl, HttpMethod.GET, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> keycloakUserInfo = response.getBody();

                // Formatear para compatibilidad
                Map<String, Object> formattedUser = new HashMap<>();
                formattedUser.put("username", keycloakUserInfo.get("preferred_username"));
                formattedUser.put("email", keycloakUserInfo.get("email"));
                formattedUser.put("name", keycloakUserInfo.get("name"));
                formattedUser.put("firstName", keycloakUserInfo.get("given_name"));
                formattedUser.put("lastName", keycloakUserInfo.get("family_name"));

                // Extraer roles
                String role = extractRoleFromKeycloakUserInfo(keycloakUserInfo);
                formattedUser.put("role", role);

                return formattedUser;
            }
        } catch (Exception e) {
            System.err.println("Error obteniendo user info de Keycloak: " + e.getMessage());
        }
        return new HashMap<>();
    }

    private String extractRoleFromKeycloakUserInfo(Map<String, Object> userInfo) {
        // Implementar lógica de extracción de roles según tu configuración de Keycloak
        // Esto depende de cómo hayas configurado los roles en tu realm
        return "USER"; // Default
    }

    private String getTokenFromCookies(HttpServletRequest request, String cookieName) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (cookieName.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    private void setSecureCookie(HttpServletResponse response, String name, String value, int maxAge) {
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // Cambiar a true en producción con HTTPS
        cookie.setPath("/");
        cookie.setMaxAge(maxAge);
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);
    }

    private void clearSecureCookie(HttpServletResponse response, String name) {
        Cookie cookie = new Cookie(name, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    private String generateState() {
        return String.valueOf(System.currentTimeMillis() + Math.random()).replace(".", "");
    }
}