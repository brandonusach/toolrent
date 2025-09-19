package com.toolrent.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        // Rutas completamente públicas (sin autenticación)
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/public/**").permitAll()

                        // Para desarrollo: permitir acceso a todas las rutas API sin autenticación
                        // REMOVER EN PRODUCCIÓN
                        .requestMatchers("/api/categories/**").permitAll()
                        .requestMatchers("/api/tools/**").permitAll()
                        .requestMatchers("/api/tool-instances/**").permitAll()
                        .requestMatchers("/api/client/**").permitAll()
                        .requestMatchers("/api/users/**").permitAll()
                        .requestMatchers("/api/loans/**").permitAll()
                        .requestMatchers("/api/reports/**").permitAll()

                        // En producción, estas rutas deberían requerir roles específicos:
                        // .requestMatchers("/api/tools/**").hasAnyRole("ADMINISTRATOR", "EMPLOYEE")
                        // .requestMatchers("/api/client/**").hasAnyRole("ADMINISTRATOR", "EMPLOYEE")
                        // .requestMatchers("/api/categories/**").hasRole("ADMINISTRATOR")
                        // .requestMatchers("/api/users/**").hasRole("ADMINISTRATOR")
                        // .requestMatchers("/api/loans/**").hasAnyRole("ADMINISTRATOR", "EMPLOYEE")
                        // .requestMatchers("/api/reports/**").hasAnyRole("ADMINISTRATOR", "EMPLOYEE")

                        // Cualquier otra ruta requiere autenticación
                        .anyRequest().permitAll() // CAMBIAR A .authenticated() cuando habilites OAuth2
                )

                // HABILITADO PARA MANEJAR KEYCLOAK JWT - descomenta cuando tengas Keycloak funcionando
                .oauth2ResourceServer(oauth2 ->
                        oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter()))
                )

                // Configuración de sesiones (stateless para JWT)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                org.springframework.security.config.http.SessionCreationPolicy.STATELESS
                        )
                );

        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Collection<GrantedAuthority> authorities = new ArrayList<>();

            // Obtener roles desde realm_access de Keycloak
            Map<String, Object> realmAccess = (Map<String, Object>) jwt.getClaims().get("realm_access");
            if (realmAccess != null && realmAccess.get("roles") instanceof List<?>) {
                List<?> roles = (List<?>) realmAccess.get("roles");
                for (Object role : roles) {
                    if (role instanceof String) {
                        // Mapear roles de Keycloak a roles de Spring Security
                        String roleStr = (String) role;
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + roleStr.toUpperCase()));
                    }
                }
            }

            // También obtener roles desde resource_access si los tienes configurados
            Map<String, Object> resourceAccess = (Map<String, Object>) jwt.getClaims().get("resource_access");
            if (resourceAccess != null) {
                // Buscar por el client ID de tu aplicación
                Object clientRoles = resourceAccess.get("toolrent-client"); // Cambia por tu client ID
                if (clientRoles instanceof Map) {
                    Object roles = ((Map<?, ?>) clientRoles).get("roles");
                    if (roles instanceof List<?>) {
                        for (Object role : (List<?>) roles) {
                            if (role instanceof String) {
                                authorities.add(new SimpleGrantedAuthority("ROLE_" + ((String) role).toUpperCase()));
                            }
                        }
                    }
                }
            }

            return authorities;
        });
        return converter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Configuración específica para desarrollo
        configuration.setAllowedOriginPatterns(Arrays.asList("http://localhost:3000", "http://127.0.0.1:3000"));
        // En producción, especifica los dominios exactos:
        // configuration.setAllowedOrigins(Arrays.asList("https://tudominio.com"));

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L); // Cache preflight por 1 hora

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}