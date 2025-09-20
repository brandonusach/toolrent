package com.toolrent.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.beans.factory.annotation.Value;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Value("${cors.allowed-origins:http://localhost:3000}")
    private String corsAllowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        // Rutas públicas de autenticación
                        .requestMatchers("/api/auth/**").permitAll()

                        // Rutas temporalmente públicas para desarrollo
                        // IMPORTANTE: En producción, estas deberían requerir autenticación
                        .requestMatchers("/api/categories/**").permitAll()
                        .requestMatchers("/api/tools/**").permitAll()
                        .requestMatchers("/api/tool-instances/**").permitAll()
                        .requestMatchers("/api/client/**").permitAll()
                        .requestMatchers("/api/loans/**").permitAll()
                        .requestMatchers("/api/reports/**").permitAll()
                        .requestMatchers("/api/damage/**").permitAll()
                        .requestMatchers("/api/fines/**").permitAll()
                        .requestMatchers("/api/kardex/**").permitAll()
                        .requestMatchers("/api/rates/**").permitAll()

                        // COMENTAR estas rutas de usuarios locales
                        // .requestMatchers("/api/users/**").permitAll()

                        // Para debugging - permitir actuator endpoints
                        .requestMatchers("/actuator/**").permitAll()

                        // Cualquier otra ruta requiere autenticación
                        .anyRequest().authenticated()
                )

                // Configuración OAuth2 Resource Server para JWT de Keycloak
                .oauth2ResourceServer(oauth2 ->
                        oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                )

                // Configuración de sesión - stateless para JWT
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                org.springframework.security.config.http.SessionCreationPolicy.STATELESS
                        )
                );

        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();

        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Collection<GrantedAuthority> authorities = new ArrayList<>();

            System.out.println("=== PROCESANDO JWT AUTHORITIES ===");
            System.out.println("JWT Claims: " + jwt.getClaims());

            // Obtener roles desde realm_access
            @SuppressWarnings("unchecked")
            Map<String, Object> realmAccess = (Map<String, Object>) jwt.getClaims().get("realm_access");
            if (realmAccess != null && realmAccess.get("roles") instanceof List<?>) {
                @SuppressWarnings("unchecked")
                List<String> roles = (List<String>) realmAccess.get("roles");
                System.out.println("Realm roles encontrados: " + roles);

                for (String role : roles) {
                    String authority = "ROLE_" + role.toUpperCase();
                    authorities.add(new SimpleGrantedAuthority(authority));
                    System.out.println("Agregado authority: " + authority);
                }
            }

            // También obtener roles desde resource_access si los hay
            @SuppressWarnings("unchecked")
            Map<String, Object> resourceAccess = (Map<String, Object>) jwt.getClaims().get("resource_access");
            if (resourceAccess != null) {
                // Buscar por tu client ID específico
                String clientId = "toolrent-frontend"; // Debe coincidir con tu configuración
                Object clientData = resourceAccess.get(clientId);

                if (clientData instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Object clientRoles = ((Map<String, Object>) clientData).get("roles");
                    if (clientRoles instanceof List<?>) {
                        @SuppressWarnings("unchecked")
                        List<String> roles = (List<String>) clientRoles;
                        System.out.println("Client roles encontrados: " + roles);

                        for (String role : roles) {
                            String authority = "ROLE_" + role.toUpperCase();
                            authorities.add(new SimpleGrantedAuthority(authority));
                            System.out.println("Agregado client authority: " + authority);
                        }
                    }
                }
            }

            System.out.println("Authorities finales: " + authorities);
            return authorities;
        });

        return converter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Configurar orígenes permitidos desde properties
        List<String> allowedOrigins = Arrays.asList(corsAllowedOrigins.split(","));
        configuration.setAllowedOriginPatterns(allowedOrigins);

        // Métodos HTTP permitidos
        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"
        ));

        // Headers permitidos
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // Permitir credenciales (cookies, headers de autorización, etc.)
        configuration.setAllowCredentials(true);

        // Tiempo de cache para preflight requests
        configuration.setMaxAge(3600L);

        // Aplicar configuración a todas las rutas /api/**
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);

        return source;
    }

    // IMPORTANTE: NO incluir PasswordEncoder bean aquí si no tienes sistema de usuarios local
    // @Bean
    // public PasswordEncoder passwordEncoder() {
    //     return new BCryptPasswordEncoder();
    // }
}