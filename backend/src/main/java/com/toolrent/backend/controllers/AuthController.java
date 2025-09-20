package com.toolrent.backend.controllers;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;

import java.util.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000}")
public class AuthController {

    @Value("${keycloak.auth-server-url}")
    private String keycloakUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.resource}")
    private String clientId;

    @Value("${frontend.url}")
    private String frontendUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/system-info")
    public ResponseEntity<?> getSystemInfo() {
        try {
            Map<String, Object> info = new HashMap<>();

            // Verificar si Keycloak está configurado
            boolean keycloakConfigured = keycloakUrl != null && !keycloakUrl.trim().isEmpty() &&
                    realm != null && !realm.trim().isEmpty() &&
                    clientId != null && !clientId.trim().isEmpty();

            info.put("keycloakEnabled", keycloakConfigured);
            info.put("keycloakUrl", keycloakUrl);
            info.put("realm", realm);
            info.put("clientId", clientId);
            info.put("frontendUrl", frontendUrl);
            info.put("timestamp", System.currentTimeMillis());

            System.out.println("=== SYSTEM INFO REQUESTED ===");
            System.out.println("Keycloak URL: " + keycloakUrl);
            System.out.println("Realm: " + realm);
            System.out.println("Client ID: " + clientId);
            System.out.println("Frontend URL: " + frontendUrl);
            System.out.println("Keycloak configured: " + keycloakConfigured);

            return ResponseEntity.ok(info);
        } catch (Exception e) {
            System.err.println("ERROR en system-info: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> errorInfo = new HashMap<>();
            errorInfo.put("keycloakEnabled", false);
            errorInfo.put("error", e.getMessage());
            return ResponseEntity.ok(errorInfo);
        }
    }

    @GetMapping("/login-url")
    public ResponseEntity<?> getLoginUrl(
            @RequestParam(required = false) String state,
            @RequestParam(required = false, name = "redirect_uri") String redirectUri) {

        System.out.println("=== LOGIN URL REQUESTED ===");
        System.out.println("State recibido: " + state);
        System.out.println("Redirect URI recibido: " + redirectUri);

        // Verificar configuración
        if (keycloakUrl == null || realm == null || clientId == null) {
            System.err.println("Keycloak no está configurado correctamente");
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Keycloak no está configurado correctamente")
            );
        }

        try {
            String finalRedirectUri = redirectUri != null ? redirectUri :
                    frontendUrl + "/callback";

            String finalState = state != null ? state :
                    UUID.randomUUID().toString().replace("-", "");

            // Construir URL de autenticación
            String loginUrl = String.format(
                    "%s/realms/%s/protocol/openid-connect/auth?" +
                            "client_id=%s&redirect_uri=%s&response_type=code&scope=openid profile email&state=%s",
                    keycloakUrl, realm, clientId, finalRedirectUri, finalState
            );

            System.out.println("Login URL generada: " + loginUrl);

            Map<String, String> response = new HashMap<>();
            response.put("loginUrl", loginUrl);
            response.put("state", finalState);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("ERROR generando login URL: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(
                    Map.of("error", "Error generando URL de login: " + e.getMessage())
            );
        }
    }

    @PostMapping("/callback")
    public ResponseEntity<?> handleCallback(@RequestBody Map<String, String> request) {
        System.out.println("=== CALLBACK RECIBIDO ===");
        System.out.println("Request recibido: " + request);

        try {
            String code = request.get("code");
            String state = request.get("state");
            String redirectUri = request.get("redirectUri");

            System.out.println("Code: " + (code != null ? code.substring(0, Math.min(code.length(), 20)) + "..." : "null"));
            System.out.println("State: " + state);
            System.out.println("Redirect URI: " + redirectUri);

            if (code == null || code.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "Código de autorización requerido")
                );
            }

            // URL para intercambio de token
            String tokenUrl = keycloakUrl + "/realms/" + realm + "/protocol/openid-connect/token";
            System.out.println("Token URL: " + tokenUrl);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> tokenRequest = new LinkedMultiValueMap<>();
            tokenRequest.add("grant_type", "authorization_code");
            tokenRequest.add("client_id", clientId);
            tokenRequest.add("code", code);
            tokenRequest.add("redirect_uri", redirectUri != null ? redirectUri : frontendUrl + "/callback");

            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(tokenRequest, headers);

            System.out.println("Enviando petición de intercambio de token...");
            System.out.println("Token request params: " + tokenRequest);

            ResponseEntity<Map> tokenResponse;
            try {
                tokenResponse = restTemplate.exchange(tokenUrl, HttpMethod.POST, entity, Map.class);
            } catch (HttpClientErrorException e) {
                System.err.println("Error HTTP en token exchange: " + e.getStatusCode());
                System.err.println("Response body: " + e.getResponseBodyAsString());

                String errorMsg = "Error intercambiando código por token";
                if (e.getStatusCode().value() == 400) {
                    errorMsg = "Código de autorización inválido, expirado o ya utilizado";
                } else if (e.getStatusCode().value() == 401) {
                    errorMsg = "Credenciales de cliente inválidas";
                }

                return ResponseEntity.badRequest().body(
                        Map.of("error", errorMsg + ": " + e.getResponseBodyAsString())
                );
            }

            System.out.println("Token response status: " + tokenResponse.getStatusCode());

            if (!tokenResponse.getStatusCode().is2xxSuccessful()) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "Error intercambiando código por token")
                );
            }

            Map<String, Object> tokenData = tokenResponse.getBody();
            String accessToken = (String) tokenData.get("access_token");
            System.out.println("Token obtenido exitosamente");

            // Obtener información del usuario
            String userInfoUrl = keycloakUrl + "/realms/" + realm + "/protocol/openid-connect/userinfo";
            System.out.println("User info URL: " + userInfoUrl);

            HttpHeaders userHeaders = new HttpHeaders();
            userHeaders.setBearerAuth(accessToken);

            HttpEntity<String> userEntity = new HttpEntity<>(userHeaders);

            ResponseEntity<Map> userResponse;
            try {
                userResponse = restTemplate.exchange(userInfoUrl, HttpMethod.GET, userEntity, Map.class);
            } catch (HttpClientErrorException e) {
                System.err.println("Error obteniendo user info: " + e.getResponseBodyAsString());
                return ResponseEntity.badRequest().body(
                        Map.of("error", "Error obteniendo información del usuario: " + e.getMessage())
                );
            }

            System.out.println("User info response status: " + userResponse.getStatusCode());

            if (!userResponse.getStatusCode().is2xxSuccessful()) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "Error obteniendo información del usuario")
                );
            }

            Map<String, Object> userInfo = userResponse.getBody();
            System.out.println("User info obtenida: " + userInfo);

            // Procesar información del usuario
            Map<String, Object> processedUser = processUserInfo(userInfo);

            // Respuesta exitosa
            Map<String, Object> response = new HashMap<>();
            response.put("access_token", accessToken);
            response.put("user", processedUser);
            response.put("success", true);

            System.out.println("=== CALLBACK PROCESADO EXITOSAMENTE ===");
            System.out.println("Usuario: " + processedUser.get("username"));
            System.out.println("Rol: " + processedUser.get("role"));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("ERROR GENERAL en callback: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(
                    Map.of("error", "Error interno procesando callback: " + e.getMessage())
            );
        }
    }

    private Map<String, Object> processUserInfo(Map<String, Object> userInfo) {
        Map<String, Object> processedUser = new HashMap<>();

        processedUser.put("username", userInfo.get("preferred_username"));
        processedUser.put("email", userInfo.get("email"));
        processedUser.put("name", userInfo.get("name"));
        processedUser.put("firstName", userInfo.get("given_name"));
        processedUser.put("lastName", userInfo.get("family_name"));

        // Obtener todos los roles del usuario
        List<String> allRoles = new ArrayList<>();

        System.out.println("=== PROCESANDO ROLES DEL USUARIO ===");
        System.out.println("UserInfo completo: " + userInfo);

        // *** NUEVO: Verificar claim directo 'roles' PRIMERO ***
        Object directRoles = userInfo.get("roles");
        if (directRoles instanceof List) {
            @SuppressWarnings("unchecked")
            List<String> directRolesList = (List<String>) directRoles;
            allRoles.addAll(directRolesList);
            System.out.println("Roles directos encontrados: " + directRolesList);
        } else {
            System.out.println("No se encontraron roles directos");
        }

        // 1. Obtener roles del realm (SOLO si no hay roles directos)
        if (allRoles.isEmpty()) {
            @SuppressWarnings("unchecked")
            Map<String, Object> realmAccess = (Map<String, Object>) userInfo.get("realm_access");
            if (realmAccess != null && realmAccess.containsKey("roles")) {
                @SuppressWarnings("unchecked")
                List<String> realmRoles = (List<String>) realmAccess.get("roles");
                if (realmRoles != null) {
                    allRoles.addAll(realmRoles);
                    System.out.println("Roles del realm encontrados: " + realmRoles);
                }
            } else {
                System.out.println("No se encontraron realm_access roles");
            }
        }

        // 2. Obtener roles de resource_access (SOLO si no hay roles directos)
        if (allRoles.isEmpty()) {
            @SuppressWarnings("unchecked")
            Map<String, Object> resourceAccess = (Map<String, Object>) userInfo.get("resource_access");
            if (resourceAccess != null) {
                System.out.println("Resource access encontrado: " + resourceAccess);

                // Buscar roles del cliente específico
                Object clientData = resourceAccess.get(clientId);
                if (clientData instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Object clientRoles = ((Map<String, Object>) clientData).get("roles");
                    if (clientRoles instanceof List) {
                        @SuppressWarnings("unchecked")
                        List<String> clientRolesList = (List<String>) clientRoles;
                        allRoles.addAll(clientRolesList);
                        System.out.println("Roles del cliente (" + clientId + ") encontrados: " + clientRolesList);
                    }
                }

                // También buscar en otros clientes posibles
                for (Map.Entry<String, Object> entry : resourceAccess.entrySet()) {
                    if (!entry.getKey().equals(clientId) && entry.getValue() instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Object roles = ((Map<String, Object>) entry.getValue()).get("roles");
                        if (roles instanceof List) {
                            @SuppressWarnings("unchecked")
                            List<String> rolesList = (List<String>) roles;
                            allRoles.addAll(rolesList);
                            System.out.println("Roles de cliente adicional (" + entry.getKey() + "): " + rolesList);
                        }
                    }
                }
            } else {
                System.out.println("No se encontraron resource_access roles");
            }
        }

        System.out.println("Todos los roles encontrados: " + allRoles);

        // 3. Determinar rol principal con lógica mejorada
        String primaryRole = determineUserRole(allRoles);

        processedUser.put("role", primaryRole);
        processedUser.put("roles", allRoles);

        System.out.println("=== RESULTADO FINAL ===");
        System.out.println("Usuario: " + processedUser.get("username"));
        System.out.println("Rol principal determinado: " + primaryRole);
        System.out.println("Todos los roles: " + allRoles);

        return processedUser;
    }

    /**
     * Determina el rol principal del usuario basado en una jerarquía de roles
     */
    private String determineUserRole(List<String> allRoles) {
        // Convertir todos los roles a minúsculas para comparación
        List<String> lowerRoles = allRoles.stream()
                .map(String::toLowerCase)
                .toList();

        System.out.println("Roles en minúsculas para comparación: " + lowerRoles);

        // Jerarquía de roles (del más alto al más bajo)
        // 1. Administrador (máxima prioridad)
        if (lowerRoles.contains("administrator") ||
                lowerRoles.contains("admin") ||
                lowerRoles.contains("administrador") ||
                lowerRoles.contains("super-admin") ||
                lowerRoles.contains("superadmin")) {
            System.out.println("Rol de administrator detectado");
            return "administrator";
        }

        // 2. Manager/Gerente
        if (lowerRoles.contains("manager") ||
                lowerRoles.contains("gerente") ||
                lowerRoles.contains("supervisor")) {
            System.out.println("Rol de manager detectado");
            return "manager";
        }

        // 3. Employee/Empleado (rol por defecto)
        if (lowerRoles.contains("employee") ||
                lowerRoles.contains("empleado") ||
                lowerRoles.contains("user") ||
                lowerRoles.contains("usuario")) {
            System.out.println("Rol de employee detectado");
            return "employee";
        }

        // Si no se encuentra ningún rol específico, pero hay roles, usar el primero
        if (!allRoles.isEmpty()) {
            String firstRole = allRoles.get(0).toLowerCase();
            System.out.println("Usando primer rol disponible como fallback: " + firstRole);
            return firstRole;
        }

        // Fallback final
        System.out.println("No se encontraron roles, usando 'employee' por defecto");
        return "employee";
    }

    @GetMapping("/user-info")
    public ResponseEntity<?> getUserInfo(@RequestHeader("Authorization") String authorization) {
        try {
            String token = authorization.replace("Bearer ", "");
            String userInfoUrl = keycloakUrl + "/realms/" + realm + "/protocol/openid-connect/userinfo";

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);

            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    userInfoUrl, HttpMethod.GET, entity, Map.class);

            // Procesar la información del usuario también aquí
            Map<String, Object> userInfo = response.getBody();
            Map<String, Object> processedUser = processUserInfo(userInfo);

            return ResponseEntity.ok(processedUser);

        } catch (Exception e) {
            System.err.println("Error obteniendo user info: " + e.getMessage());
            return ResponseEntity.status(401).body(
                    Map.of("error", "Token inválido o expirado")
            );
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            String logoutUrl = keycloakUrl + "/realms/" + realm +
                    "/protocol/openid-connect/logout?redirect_uri=" + frontendUrl;

            System.out.println("Logout URL generada: " + logoutUrl);

            return ResponseEntity.ok(Map.of("logoutUrl", logoutUrl));

        } catch (Exception e) {
            System.err.println("Error en logout: " + e.getMessage());
            return ResponseEntity.status(500).body(
                    Map.of("error", "Error en logout: " + e.getMessage())
            );
        }
    }
}