package com.toolrent.backend.services;

import com.toolrent.backend.repositories.ClientRepository;
import com.toolrent.backend.entities.ClientEntity;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;

@Service
public class ClientService {

    @Autowired
    ClientRepository clientRepository;

    // Get clients by name
    public List<ClientEntity> getClientsByName(String name) {
        return clientRepository.findByNameContainingIgnoreCase(name);
    }

    public ClientEntity getClientByRut(String rut) {
        return clientRepository.findByRut(rut);
    }

    public List<ClientEntity> getClientsByStatus(ClientEntity.ClientStatus status) {
        return clientRepository.findByStatus(status);
    }

    public List<ClientEntity> getAllClients() {
        return clientRepository.findAll();
    }

    // Check if client exists by RUT
    public boolean existsByRut(String rut) {
        return clientRepository.existsByRut(rut);
    }

    // CREATE - Save new client
    public ClientEntity saveClient(ClientEntity client) {
        return clientRepository.save(client);
    }

    // UPDATE - Update existing client
    public ClientEntity updateClient(ClientEntity client) {
        return clientRepository.save(client);
    }

    // READ - Get client by ID
    public ClientEntity getClientById(Long id) {
        return clientRepository.findById(id).orElse(null);
    }

    // DELETE - Delete client by ID
    public boolean deleteClient(Long id) throws Exception {
        try {
            clientRepository.deleteById(id);
            return true;
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }
}