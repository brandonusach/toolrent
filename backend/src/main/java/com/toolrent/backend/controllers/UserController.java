package com.toolrent.backend.controllers;

import com.toolrent.backend.entities.UserEntity;
import com.toolrent.backend.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    // GET - Obtener todos los usuarios (solo ADMIN)
    @PreAuthorize("hasRole('ADMIN') or hasRole('administrator')")
    @GetMapping
    public ResponseEntity<List<UserEntity>> getAllUsers() {
        List<UserEntity> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    // GET - Obtener usuario por ID (USER y ADMIN pueden ver usuarios)
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN', 'employee', 'administrator')")
    @GetMapping("/{id}")
    public ResponseEntity<UserEntity> getUserById(@PathVariable Long id) {
        Optional<UserEntity> user = userService.getUserById(id);
        return user.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // GET - Obtener usuario por username (USER y ADMIN pueden buscar usuarios)
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'user', 'administrator')")
    @GetMapping("/username/{username}")
    public ResponseEntity<UserEntity> getUserByUsername(@PathVariable String username) {
        Optional<UserEntity> user = userService.getUserByUsername(username);
        return user.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST - Crear nuevo usuario (solo ADMIN)
    @PreAuthorize("hasRole('ADMIN') or hasRole('administrator')")
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody UserEntity user) {
        try {
            // Verificar si el username ya existe
            if (userService.existsByUsername(user.getUsername())) {
                return ResponseEntity.badRequest()
                        .body("Error: El username ya está en uso");
            }

            UserEntity savedUser = userService.createUser(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Error al crear usuario: " + e.getMessage());
        }
    }

    // PUT - Actualizar usuario (solo ADMIN)
    @PreAuthorize("hasRole('ADMIN') or hasRole('administrator')")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UserEntity userDetails) {
        try {
            UserEntity updatedUser = userService.updateUser(id, userDetails);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Error al actualizar usuario: " + e.getMessage());
        }
    }

    // DELETE - Eliminar usuario (solo ADMIN)
    @PreAuthorize("hasRole('ADMIN') or hasRole('administrator')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok().body("Usuario eliminado correctamente");
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Error al eliminar usuario: " + e.getMessage());
        }
    }

    // GET - Obtener usuarios por rol (solo ADMIN)
    @PreAuthorize("hasRole('ADMIN') or hasRole('administrator')")
    @GetMapping("/role/{role}")
    public ResponseEntity<List<UserEntity>> getUsersByRole(@PathVariable UserEntity.Role role) {
        List<UserEntity> users = userService.getUsersByRole(role);
        return ResponseEntity.ok(users);
    }

    // GET - Obtener todos los administradores (solo ADMIN)
    @PreAuthorize("hasRole('ADMIN') or hasRole('administrator')")
    @GetMapping("/administrators")
    public ResponseEntity<List<UserEntity>> getAllAdministrators() {
        List<UserEntity> administrators = userService.getAllAdministrators();
        return ResponseEntity.ok(administrators);
    }

    // GET - Obtener todos los empleados (USER y ADMIN pueden ver empleados)
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN', 'employee', 'administrator')")
    @GetMapping("/employees")
    public ResponseEntity<List<UserEntity>> getAllEmployees() {
        List<UserEntity> employees = userService.getAllEmployees();
        return ResponseEntity.ok(employees);
    }

    // GET - Contar usuarios por rol (solo ADMIN)
    @PreAuthorize("hasRole('ADMIN') or hasRole('administrator')")
    @GetMapping("/count/{role}")
    public ResponseEntity<Long> countUsersByRole(@PathVariable UserEntity.Role role) {
        long count = userService.countUsersByRole(role);
        return ResponseEntity.ok(count);
    }

    // GET - Verificar si existe username (cualquier usuario autenticado)
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN', 'employee', 'administrator')")
    @GetMapping("/exists/{username}")
    public ResponseEntity<Boolean> existsByUsername(@PathVariable String username) {
        boolean exists = userService.existsByUsername(username);
        return ResponseEntity.ok(exists);
    }
}