package com.toolrent.backend.controllers;

import com.toolrent.backend.config.KeycloakConfigProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private KeycloakConfigProperties keycloakConfig;

    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

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
        String loginUrl = String.format("%s?client_id=%s&redirect_uri=%s/callback&response_type=code&scope=openid profile email",
                keycloakConfig.getAuthUrl(),
                keycloakConfig.getResource(),
                frontendUrl);

        response.put("loginUrl", loginUrl);
        return ResponseEntity.ok(response);
    }

    /**
     * Obtiene información del usuario autenticado
     */
    @GetMapping("/user-info")
    public ResponseEntity<Map<String, Object>> getUserInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) authentication.getPrincipal();

            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("username", jwt.getClaimAsString("preferred_username"));
            userInfo.put("email", jwt.getClaimAsString("email"));
            userInfo.put("name", jwt.getClaimAsString("name"));
            userInfo.put("firstName", jwt.getClaimAsString("given_name"));
            userInfo.put("lastName", jwt.getClaimAsString("family_name"));
            userInfo.put("roles", authentication.getAuthorities());

            return ResponseEntity.ok(userInfo);
        }

        return ResponseEntity.status(401).build();
    }

    /**
     * Valida el token actual
     */
    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateToken() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.isAuthenticated() &&
                authentication.getPrincipal() instanceof Jwt) {

            Map<String, Object> response = new HashMap<>();
            response.put("valid", true);
            response.put("authorities", authentication.getAuthorities());
            response.put("username", ((Jwt) authentication.getPrincipal()).getClaimAsString("preferred_username"));

            return ResponseEntity.ok(response);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("valid", false);
        response.put("message", "Token inválido o expirado");

        return ResponseEntity.status(401).body(response);
    }

    /**
     * Información del sistema de autenticación
     */
    @GetMapping("/system-info")
    public ResponseEntity<Map<String, Object>> getSystemInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("keycloakEnabled", keycloakConfig.isConfigured());
        info.put("keycloakUrl", keycloakConfig.getAuthServerUrl());
        info.put("realm", keycloakConfig.getRealm());
        info.put("clientId", keycloakConfig.getResource());
        info.put("version", "2.0.0");
        info.put("authMode", "keycloak");

        return ResponseEntity.ok(info);
    }

    /**
     * Logout - devuelve la URL de logout de Keycloak
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        if (!keycloakConfig.isConfigured()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Keycloak no está configurado");
            return ResponseEntity.badRequest().body(error);
        }

        Map<String, String> response = new HashMap<>();
        String logoutUrl = String.format("%s?redirect_uri=%s",
                keycloakConfig.getLogoutUrl(),
                frontendUrl);

        response.put("logoutUrl", logoutUrl);
        return ResponseEntity.ok(response);
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
}