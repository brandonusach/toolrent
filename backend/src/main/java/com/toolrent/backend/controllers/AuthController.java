package com.toolrent.backend.controllers;

import com.toolrent.backend.dto.LoginRequest;
import com.toolrent.backend.dto.LoginResponse;
import com.toolrent.backend.entities.UserEntity;
import com.toolrent.backend.security.JwtUtil;
import com.toolrent.backend.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
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

    @PostMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body("Token no válido");
            }

            String token = authHeader.substring(7);
            String username = jwtUtil.getUsernameFromToken(token);

            if (jwtUtil.validateToken(token, username)) {
                return ResponseEntity.ok("Token válido");
            } else {
                return ResponseEntity.badRequest().body("Token expirado o inválido");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error validando token: " + e.getMessage());
        }
    }
}