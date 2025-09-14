package com.toolrent.backend.controllers;

import com.toolrent.backend.entities.ClientEntity;
import com.toolrent.backend.services.ClientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/client")
@CrossOrigin(origins = "*")
public class ClientController {

    @Autowired
    ClientService clientService;

    // GET /api/client/ - Get all clients
    @GetMapping("/")
    public ResponseEntity<List<ClientEntity>> getAllClients() {
        try {
            List<ClientEntity> clients = clientService.getAllClients();
            if (clients.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            }
            return new ResponseEntity<>(clients, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/client/{id} - Get client by ID
    @GetMapping("/{id}")
    public ResponseEntity<ClientEntity> getClientById(@PathVariable Long id) {
        try {
            ClientEntity client = clientService.getClientById(id);
            if (client != null) {
                return new ResponseEntity<>(client, HttpStatus.OK);
            }
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/client/rut/{rut} - Get client by RUT
    @GetMapping("/rut/{rut}")
    public ResponseEntity<ClientEntity> getClientByRut(@PathVariable String rut) {
        try {
            ClientEntity client = clientService.getClientByRut(rut);
            if (client != null) {
                return new ResponseEntity<>(client, HttpStatus.OK);
            }
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/client/name/{name} - Get clients by name (partial search)
    @GetMapping("/name/{name}")
    public ResponseEntity<List<ClientEntity>> getClientsByName(@PathVariable String name) {
        try {
            List<ClientEntity> clients = clientService.getClientsByName(name);
            if (clients.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            }
            return new ResponseEntity<>(clients, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/client/status/{status} - Get clients by status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ClientEntity>> getClientsByStatus(@PathVariable ClientEntity.ClientStatus status) {
        try {
            List<ClientEntity> clients = clientService.getClientsByStatus(status);
            if (clients.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            }
            return new ResponseEntity<>(clients, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/client/exists/{rut} - Check if client exists by RUT
    @GetMapping("/exists/{rut}")
    public ResponseEntity<Boolean> existsByRut(@PathVariable String rut) {
        try {
            boolean exists = clientService.existsByRut(rut);
            return new ResponseEntity<>(exists, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // POST /api/client/ - Create new client
    @PostMapping("/")
    public ResponseEntity<ClientEntity> createClient(@RequestBody ClientEntity client) {
        try {
            // Check if client already exists
            if (clientService.existsByRut(client.getRut())) {
                return new ResponseEntity<>(HttpStatus.CONFLICT); // 409 - Client already exists
            }
            ClientEntity savedClient = clientService.saveClient(client);
            return new ResponseEntity<>(savedClient, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // PUT /api/client/{id} - Update existing client
    @PutMapping("/{id}")
    public ResponseEntity<ClientEntity> updateClient(@PathVariable Long id, @RequestBody ClientEntity client) {
        try {
            ClientEntity existingClient = clientService.getClientById(id);
            if (existingClient == null) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            // Set the ID to ensure we're updating the correct client
            client.setId(id);
            ClientEntity updatedClient = clientService.updateClient(client);
            return new ResponseEntity<>(updatedClient, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // DELETE /api/client/{id} - Delete client by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable Long id) {
        try {
            ClientEntity existingClient = clientService.getClientById(id);
            if (existingClient == null) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            boolean deleted = clientService.deleteClient(id);
            if (deleted) {
                return new ResponseEntity<>(HttpStatus.NO_CONTENT); // 204 - Successfully deleted
            }
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}