package com.toolrent.backend.controllers;

import com.toolrent.backend.entities.ClientEntity;
import com.toolrent.backend.services.ClientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/clients")
@CrossOrigin("*")
public class ClientController {

    @Autowired
    ClientService clientService;

    @GetMapping("/")
    public ResponseEntity<List<ClientEntity>> listClients() {
        List<ClientEntity> clients = clientService.getAllClients();
        return ResponseEntity.ok(clients);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClientEntity> getClientById(@PathVariable Long id) {
        ClientEntity client = clientService.getClientById(id);
        if (client != null) {
            return ResponseEntity.ok(client);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/")
    public ResponseEntity<?> saveClient(@RequestBody ClientEntity client) {
        try {
            ClientEntity newClient = clientService.saveClient(client);
            return ResponseEntity.ok(newClient);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Patrón del profesor - PUT sin ID en la URL, enviando objeto completo con ID
    @PutMapping("/")
    public ResponseEntity<?> updateClient(@RequestBody ClientEntity client) {
        try {
            ClientEntity updatedClient = clientService.updateClient(client);
            return ResponseEntity.ok(updatedClient);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteClientById(@PathVariable Long id) {
        try {
            boolean deleted = clientService.deleteClient(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Endpoints específicos del negocio
    @GetMapping("/rut/{rut}")
    public ResponseEntity<ClientEntity> getClientByRut(@PathVariable String rut) {
        ClientEntity client = clientService.getClientByRut(rut);
        if (client != null) {
            return ResponseEntity.ok(client);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/exists/{rut}")
    public ResponseEntity<Boolean> existsByRut(@PathVariable String rut) {
        boolean exists = clientService.existsByRut(rut);
        return ResponseEntity.ok(exists);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateClientStatus(@PathVariable Long id,
                                                @RequestParam ClientEntity.ClientStatus status) {
        try {
            ClientEntity updatedClient = clientService.changeClientStatus(id, status);
            return ResponseEntity.ok(updatedClient);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}