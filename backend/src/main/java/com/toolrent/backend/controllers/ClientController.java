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

    // GET /api/client/rut/{rut} - Get client by RUT (normaliza el RUT internamente)
    @GetMapping("/rut/{rut}")
    public ResponseEntity<ClientEntity> getClientByRut(@PathVariable String rut) {
        try {
            // El servicio maneja la normalización del RUT
            ClientEntity client = clientService.getClientByRut(rut);
            if (client != null) {
                return new ResponseEntity<>(client, HttpStatus.OK);
            }
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
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
            return new ResponseEntity<>(false, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // POST /api/client/ - Create new client
    @PostMapping("/")
    public ResponseEntity<?> createClient(@RequestBody ClientEntity client) {
        try {
            ClientEntity savedClient = clientService.saveClient(client);
            return new ResponseEntity<>(savedClient, HttpStatus.CREATED);
        } catch (Exception e) {
            // Devolver el mensaje de error específico del servicio
            if (e.getMessage().contains("Ya existe")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(e.getMessage());
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        }
    }

    // PUT /api/client/{id} - Update existing client
    @PutMapping("/{id}")
    public ResponseEntity<?> updateClient(@PathVariable Long id, @RequestBody ClientEntity client) {
        try {
            ClientEntity existingClient = clientService.getClientById(id);
            if (existingClient == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Cliente no encontrado");
            }

            // Set the ID to ensure we're updating the correct client
            client.setId(id);
            ClientEntity updatedClient = clientService.updateClient(client);
            return new ResponseEntity<>(updatedClient, HttpStatus.OK);
        } catch (Exception e) {
            // Devolver el mensaje de error específico del servicio
            if (e.getMessage().contains("Ya existe")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(e.getMessage());
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        }
    }

    // DELETE /api/client/{id} - Delete client by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteClient(@PathVariable Long id) {
        try {
            ClientEntity existingClient = clientService.getClientById(id);
            if (existingClient == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Cliente no encontrado");
            }

            boolean deleted = clientService.deleteClient(id);
            if (deleted) {
                return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al eliminar cliente");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        }
    }

    // Método adicional: cambiar solo el estado del cliente
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateClientStatus(@PathVariable Long id,
                                                @RequestBody ClientEntity.ClientStatus status) {
        try {
            ClientEntity updatedClient = clientService.changeClientStatus(id, status);
            return new ResponseEntity<>(updatedClient, HttpStatus.OK);
        } catch (Exception e) {
            if (e.getMessage().contains("no existe")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(e.getMessage());
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        }
    }
}