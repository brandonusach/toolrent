package com.toolrent.backend.repositories;

import com.toolrent.backend.entities.ClientEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;


@Repository
public interface ClientRepository extends JpaRepository<ClientEntity, Long> {

    // To verify the existence
    boolean existsByRut(String rut);
    public ClientEntity findByRut(String rut);
    // Find Clients by name
    List<ClientEntity> findByNameContainingIgnoreCase(String name);
    // Find Clients by Status
    List<ClientEntity> findByStatus(ClientEntity.ClientStatus status);

    @Query(value = "SELECT * FROM clients WHERE clients.rut = :rut", nativeQuery = true)
    ClientEntity findByRutNativeQuery(@Param("rut") String rut);
}

