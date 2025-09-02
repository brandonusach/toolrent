package com.toolrent.backend.repositories;

import com.toolrent.backend.entities.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {

    // Find user by username for authentication
    Optional<UserEntity> findByUsername(String username);

    // Check if username already exists
    boolean existsByUsername(String username);

    // Find users by role
    List<UserEntity> findByRole(UserEntity.Role role);

    // Find users by role with custom query
    @Query("SELECT u FROM UserEntity u WHERE u.role = :role")
    List<UserEntity> findUsersByRole(@Param("role") UserEntity.Role role);

    // Count users by role
    long countByRole(UserEntity.Role role);

    // Find all administrators
    @Query("SELECT u FROM UserEntity u WHERE u.role = 'ADMINISTRATOR'")
    List<UserEntity> findAllAdministrators();

    // Find all employees
    @Query("SELECT u FROM UserEntity u WHERE u.role = 'EMPLOYEE'")
    List<UserEntity> findAllEmployees();
}