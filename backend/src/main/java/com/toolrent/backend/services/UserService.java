package com.toolrent.backend.services;

import com.toolrent.backend.entities.UserEntity;
import com.toolrent.backend.repositories.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Usa constructor injection
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Obtener todos los usuarios
    public List<UserEntity> getAllUsers() {
        return userRepository.findAll();
    }

    // Obtener usuario por ID
    public Optional<UserEntity> getUserById(Long id) {
        return userRepository.findById(id);
    }

    // Obtener usuario por username
    public Optional<UserEntity> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    // Crear nuevo usuario (con contraseña encriptada)
    public UserEntity createUser(UserEntity user) {
        // Encriptar la contraseña antes de guardar
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    // Actualizar usuario
    public UserEntity updateUser(Long id, UserEntity userDetails) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

        user.setUsername(userDetails.getUsername());

        // Solo encriptar si la contraseña ha cambiado
        if (!user.getPassword().equals(userDetails.getPassword())) {
            user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
        }

        user.setRole(userDetails.getRole());
        return userRepository.save(user);
    }

    // Eliminar usuario
    public void deleteUser(Long id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
        userRepository.delete(user);
    }

    // Verificar si existe username
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    // Obtener usuarios por rol
    public List<UserEntity> getUsersByRole(UserEntity.Role role) {
        return userRepository.findByRole(role);
    }

    // Obtener todos los administradores
    public List<UserEntity> getAllAdministrators() {
        return userRepository.findAllAdministrators();
    }

    // Obtener todos los empleados
    public List<UserEntity> getAllEmployees() {
        return userRepository.findAllEmployees();
    }

    // Contar usuarios por rol
    public long countUsersByRole(UserEntity.Role role) {
        return userRepository.countByRole(role);
    }
}