package com.toolrent.backend.config;

import com.toolrent.backend.entities.UserEntity;
import com.toolrent.backend.services.UserService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserService userService;

    public DataInitializer(UserService userService) {
        this.userService = userService;
    }

    @Override
    public void run(String... args) throws Exception {
        initializeUsers();
    }

    private void initializeUsers() {
        // Crear usuario administrador si no existe
        if (!userService.existsByUsername("admin")) {
            UserEntity admin = new UserEntity();
            admin.setUsername("admin");
            admin.setPassword("admin123"); // Se encriptará automáticamente
            admin.setRole(UserEntity.Role.ADMINISTRATOR);

            userService.createUser(admin);
            System.out.println("✓ Usuario admin creado: admin / admin123");
        }

        // Crear empleado de prueba si no existe
        if (!userService.existsByUsername("empleado")) {
            UserEntity empleado = new UserEntity();
            empleado.setUsername("empleado");
            empleado.setPassword("empleado123");
            empleado.setRole(UserEntity.Role.EMPLOYEE);

            userService.createUser(empleado);
            System.out.println("✓ Usuario empleado creado: empleado / empleado123");
        }

        System.out.println("=== Usuarios disponibles para login ===");
        System.out.println("Admin: admin / admin123");
        System.out.println("Empleado: empleado / empleado123");
        System.out.println("=====================================");
    }
}