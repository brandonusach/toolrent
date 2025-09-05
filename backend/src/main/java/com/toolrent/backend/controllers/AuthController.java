package com.toolrent.backend.controllers;

import com.toolrent.backend.dto.LoginRequest;
import com.toolrent.backend.dto.LoginResponse;
import com.toolrent.backend.entities.UserEntity;
import com.toolrent.backend.security.JwtUtil;
import com.toolrent.backend.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired(required = false)
    private UserService userService;

    @Autowired(required = false)
    private JwtUtil jwtUtil;

    @Autowired(required = false)
    private PasswordEncoder passwordEncoder;

    @Value("${keycloak.auth-server-url:}")
    private String keycloakServerUrl;

    @Value("${keycloak.realm:}")
    private String realm;

    // ===== ENDPOINTS LEGACY (mantener compatibilidad) =====

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        if (userService == null || jwtUtil == null || passwordEncoder == null) {
            return ResponseEntity.badRequest().body("Sistema de autenticación legacy no disponible");
        }

        try {
            Optional<UserEntity> userOptional = userService.getUserByUsername(loginRequest.getUsername());

            if (userOptional.isEmpty()) {
                return ResponseEntity.badRequest().body("Usuario no encontrado");
            }

            UserEntity user = userOptional.get();

            // Verificar contraseña
            if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                return ResponseEntity.badRequest().body("Contraseña incorrecta");
            }

            // Generar token JWT
            String token = jwtUtil.generateToken(user.getUsername(), user.getRole().toString());

            LoginResponse response = new LoginResponse(
                    token,
                    user.getId(),
                    user.getUsername(),
                    user.getRole().toString()
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error en el login: " + e.getMessage());
        }
    }

    // ===== ENDPOINTS KEYCLOAK =====

    @GetMapping("/keycloak/login-url")
    public ResponseEntity<Map<String, String>> getKeycloakLoginUrl() {
        if (keycloakServerUrl == null || keycloakServerUrl.isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Keycloak no está configurado");
            return ResponseEntity.badRequest().body(error);
        }

        Map<String, String> response = new HashMap<>();
        String loginUrl = String.format("%s/realms/%s/protocol/openid-connect/auth" +
                        "?client_id=toolrent-frontend" +
                        "&redirect_uri=http://localhost:3000/callback" +
                        "&response_type=code" +
                        "&scope=openid profile email",
                keycloakServerUrl, realm);

        response.put("loginUrl", loginUrl);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/keycloak/user-info")
    public ResponseEntity<Map<String, Object>> getKeycloakUserInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) authentication.getPrincipal();

            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("username", jwt.getClaimAsString("preferred_username"));
            userInfo.put("email", jwt.getClaimAsString("email"));
            userInfo.put("name", jwt.getClaimAsString("name"));
            userInfo.put("roles", authentication.getAuthorities());

            return ResponseEntity.ok(userInfo);
        }

        return ResponseEntity.status(401).build();
    }

    // ===== ENDPOINTS UNIVERSALES =====

    @PostMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // Intentar validación con Keycloak primero
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof Jwt) {
                Map<String, Object> response = new HashMap<>();
                response.put("valid", true);
                response.put("type", "keycloak");
                response.put("authorities", authentication.getAuthorities());
                return ResponseEntity.ok(response);
            }

            // Fallback a JWT legacy
            if (authHeader != null && authHeader.startsWith("Bearer ") && jwtUtil != null) {
                String token = authHeader.substring(7);
                try {
                    String username = jwtUtil.getUsernameFromToken(token);
                    if (jwtUtil.validateToken(token, username)) {
                        Map<String, Object> response = new HashMap<>();
                        response.put("valid", true);
                        response.put("type", "legacy");
                        response.put("username", username);
                        return ResponseEntity.ok(response);
                    }
                } catch (Exception jwtException) {
                    // Token JWT inválido, continuar con el flujo normal
                }
            }

            return ResponseEntity.badRequest().body("Token expirado o inválido");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error validando token: " + e.getMessage());
        }
    }

    @GetMapping("/system-info")
    public ResponseEntity<Map<String, Object>> getSystemInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("keycloakEnabled", keycloakServerUrl != null && !keycloakServerUrl.isEmpty());
        info.put("legacyJwtEnabled", jwtUtil != null);
        info.put("keycloakUrl", keycloakServerUrl);
        info.put("realm", realm);

        // Información adicional del sistema
        info.put("version", "1.0.0");
        info.put("authModes", new String[]{"legacy", "keycloak"});

        return ResponseEntity.ok(info);
    }

    // ===== ENDPOINTS DE COMPATIBILIDAD (mantener nombres originales) =====

    @GetMapping("/login-url")
    public ResponseEntity<Map<String, String>> getLoginUrl() {
        // Redirigir al endpoint de Keycloak
        return getKeycloakLoginUrl();
    }

    @GetMapping("/user-info")
    public ResponseEntity<Map<String, Object>> getUserInfo() {
        // Redirigir al endpoint de Keycloak
        return getKeycloakUserInfo();
    }
}