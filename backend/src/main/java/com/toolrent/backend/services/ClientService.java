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

    // CREATE - Save new client with business validations
    public ClientEntity saveClient(ClientEntity client) throws Exception {
        // Validar campos requeridos
        validateRequiredFields(client);

        // Validar formato RUT chileno
        if (!isValidRut(client.getRut())) {
            throw new Exception("RUT chileno inválido: " + client.getRut());
        }

        // Validar formato teléfono chileno
        if (!isValidChileanPhone(client.getPhone())) {
            throw new Exception("Número de teléfono chileno inválido: " + client.getPhone());
        }

        // Validar formato email
        if (!isValidEmail(client.getEmail())) {
            throw new Exception("Formato de email inválido: " + client.getEmail());
        }

        // Normalizar RUT antes de validar unicidad
        String normalizedRut = normalizeRut(client.getRut());

        // Validar que el RUT no esté registrado
        if (clientRepository.existsByRut(normalizedRut)) {
            throw new Exception("Ya existe un cliente con RUT: " + formatRut(normalizedRut));
        }

        // Validar que el teléfono no esté registrado
        String normalizedPhone = normalizePhone(client.getPhone());
        if (existsByPhone(normalizedPhone)) {
            throw new Exception("Ya existe un cliente con el teléfono: " + client.getPhone());
        }

        // Validar que el email no esté registrado
        if (existsByEmail(client.getEmail().toLowerCase())) {
            throw new Exception("Ya existe un cliente con el email: " + client.getEmail());
        }

        // Normalizar datos antes de guardar
        client.setRut(normalizedRut);
        client.setPhone(normalizedPhone);
        client.setEmail(client.getEmail().toLowerCase().trim());
        client.setName(client.getName().trim());

        // Establecer estado por defecto si no se especifica
        if (client.getStatus() == null) {
            client.setStatus(ClientEntity.ClientStatus.ACTIVE);
        }

        return clientRepository.save(client);
    }

    // UPDATE - Update existing client with business validations
    public ClientEntity updateClient(ClientEntity client) throws Exception {
        // Verificar que el cliente existe
        if (client.getId() == null) {
            throw new Exception("ID del cliente es requerido para actualización");
        }

        ClientEntity existingClient = clientRepository.findById(client.getId()).orElse(null);
        if (existingClient == null) {
            throw new Exception("Cliente con ID " + client.getId() + " no existe");
        }

        // Validar campos requeridos
        validateRequiredFields(client);

        // Validar formato RUT chileno
        if (!isValidRut(client.getRut())) {
            throw new Exception("RUT chileno inválido: " + client.getRut());
        }

        // Validar formato teléfono chileno
        if (!isValidChileanPhone(client.getPhone())) {
            throw new Exception("Número de teléfono chileno inválido: " + client.getPhone());
        }

        // Validar formato email
        if (!isValidEmail(client.getEmail())) {
            throw new Exception("Formato de email inválido: " + client.getEmail());
        }

        // Normalizar datos
        String normalizedRut = normalizeRut(client.getRut());
        String normalizedPhone = normalizePhone(client.getPhone());
        String normalizedEmail = client.getEmail().toLowerCase().trim();

        // Validar unicidad solo si se cambiaron los valores
        if (!normalizedRut.equals(existingClient.getRut())) {
            if (clientRepository.existsByRut(normalizedRut)) {
                throw new Exception("Ya existe otro cliente con RUT: " + formatRut(normalizedRut));
            }
        }

        if (!normalizedPhone.equals(existingClient.getPhone())) {
            if (existsByPhone(normalizedPhone)) {
                throw new Exception("Ya existe otro cliente con el teléfono: " + client.getPhone());
            }
        }

        if (!normalizedEmail.equals(existingClient.getEmail())) {
            if (existsByEmail(normalizedEmail)) {
                throw new Exception("Ya existe otro cliente con el email: " + client.getEmail());
            }
        }

        // Actualizar datos normalizados
        client.setRut(normalizedRut);
        client.setPhone(normalizedPhone);
        client.setEmail(normalizedEmail);
        client.setName(client.getName().trim());

        return clientRepository.save(client);
    }

    // READ - Get client by ID
    public ClientEntity getClientById(Long id) {
        return clientRepository.findById(id).orElse(null);
    }

    // DELETE - Delete client by ID with business validation
    public boolean deleteClient(Long id) throws Exception {
        try {
            ClientEntity existingClient = clientRepository.findById(id).orElse(null);
            if (existingClient == null) {
                throw new Exception("Cliente con ID " + id + " no existe");
            }

            // Aquí podrías agregar validaciones adicionales como:
            // - Verificar que no tenga préstamos activos
            // - Verificar que no tenga deudas pendientes

            clientRepository.deleteById(id);
            return true;
        } catch (Exception e) {
            throw new Exception("Error al eliminar cliente: " + e.getMessage());
        }
    }

    // Metodo para cambiar estado de cliente (útil para restricciones)
    public ClientEntity changeClientStatus(Long id, ClientEntity.ClientStatus newStatus) throws Exception {
        ClientEntity client = clientRepository.findById(id).orElse(null);
        if (client == null) {
            throw new Exception("Cliente con ID " + id + " no existe");
        }

        client.setStatus(newStatus);
        return clientRepository.save(client);
    }

    // Metodo para obtener RUT formateado para visualización
    public String getFormattedRut(String rut) {
        return formatRut(rut);
    }

    // =============================================================================
    // MÉTODOS PRIVADOS DE VALIDACIÓN Y NORMALIZACIÓN
    // =============================================================================

    /**
     * Valida que todos los campos requeridos estén presentes
     */
    private void validateRequiredFields(ClientEntity client) throws Exception {
        if (client == null) {
            throw new Exception("Los datos del cliente son requeridos");
        }

        if (client.getName() == null || client.getName().trim().isEmpty()) {
            throw new Exception("El nombre del cliente es requerido");
        }

        if (client.getName().trim().length() < 2) {
            throw new Exception("El nombre del cliente debe tener al menos 2 caracteres");
        }

        if (client.getRut() == null || client.getRut().trim().isEmpty()) {
            throw new Exception("El RUT del cliente es requerido");
        }

        if (client.getPhone() == null || client.getPhone().trim().isEmpty()) {
            throw new Exception("El teléfono del cliente es requerido");
        }

        if (client.getEmail() == null || client.getEmail().trim().isEmpty()) {
            throw new Exception("El email del cliente es requerido");
        }
    }

    /**
     * Valida si un RUT chileno es válido
     */
    private boolean isValidRut(String rut) {
        if (rut == null || rut.trim().isEmpty()) {
            return false;
        }

        try {
            // Limpiar el RUT: quitar puntos y convertir a mayúscula
            String cleanRut = rut.replaceAll("[.-]", "").toUpperCase().trim();

            // Verificar longitud mínima y máxima (7-9 caracteres)
            if (cleanRut.length() < 7 || cleanRut.length() > 9) {
                return false;
            }

            // Separar número y dígito verificador
            String number = cleanRut.substring(0, cleanRut.length() - 1);
            String checkDigit = cleanRut.substring(cleanRut.length() - 1);

            // Verificar que la parte numérica sea solo números
            if (!number.matches("\\d+")) {
                return false;
            }

            // Verificar que el dígito verificador sea número o K
            if (!checkDigit.matches("[0-9K]")) {
                return false;
            }

            // Calcular y verificar dígito verificador
            return calculateCheckDigit(Integer.parseInt(number)).equals(checkDigit);

        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Calcula el dígito verificador de un RUT chileno
     */
    private String calculateCheckDigit(int rut) {
        int sum = 0;
        int multiplier = 2;

        // Calcular suma ponderada de derecha a izquierda
        while (rut > 0) {
            sum += (rut % 10) * multiplier;
            rut /= 10;
            multiplier = multiplier == 7 ? 2 : multiplier + 1;
        }

        // Calcular dígito verificador
        int remainder = 11 - (sum % 11);

        if (remainder == 11) {
            return "0";
        } else if (remainder == 10) {
            return "K";
        } else {
            return String.valueOf(remainder);
        }
    }

    /**
     * Valida si un número de teléfono chileno es válido
     */
    private boolean isValidChileanPhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return false;
        }

        // Limpiar el número: quitar espacios, guiones, paréntesis
        String cleanPhone = phone.replaceAll("[\\s\\-\\(\\)]", "");

        // Remover código de país si está presente (+56 o 56)
        if (cleanPhone.startsWith("+56")) {
            cleanPhone = cleanPhone.substring(3);
        } else if (cleanPhone.startsWith("56") && cleanPhone.length() > 10) {
            cleanPhone = cleanPhone.substring(2);
        }

        // Validar celulares (9 dígitos, empiezan con 9)
        if (cleanPhone.matches("^9[0-9]{8}$")) {
            return true;
        }

        // Validar teléfonos fijos Santiago (8 dígitos, empiezan con 22)
        if (cleanPhone.matches("^22[0-9]{6}$")) {
            return true;
        }

        // Validar teléfonos fijos regiones (8 dígitos, códigos de área válidos)
        // Códigos principales: 32,33,34,35,41,42,43,45,51,52,53,55,57,58,61,63,64,65,67,71,72,73,75
        if (cleanPhone.matches("^(3[2-5]|4[1-5]|5[1358]|6[134567]|7[1-5])[0-9]{6}$")) {
            return true;
        }

        return false;
    }

    /**
     * Valida formato de email básico
     */
    private boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }

        String emailRegex = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
        return email.matches(emailRegex);
    }

    /**
     * Normaliza un RUT quitando puntos y guiones, dejando solo números y K
     */
    private String normalizeRut(String rut) {
        if (rut == null) {
            return null;
        }
        return rut.replaceAll("[.-]", "").toUpperCase().trim();
    }

    /**
     * Normaliza un teléfono chileno
     */
    private String normalizePhone(String phone) {
        if (phone == null) {
            return null;
        }

        String cleanPhone = phone.replaceAll("[\\s\\-\\(\\)]", "");

        // Si tiene código de país, mantenerlo
        if (cleanPhone.startsWith("+56")) {
            return cleanPhone;
        } else if (cleanPhone.startsWith("56") && cleanPhone.length() > 10) {
            return "+56" + cleanPhone.substring(2);
        } else {
            // Si es un número local, agregar código de país
            return "+56" + cleanPhone;
        }
    }

    /**
     * Formatea un RUT con puntos y guión para visualización
     */
    private String formatRut(String rut) {
        if (rut == null || rut.length() < 7) {
            return rut;
        }

        String cleanRut = normalizeRut(rut);
        String number = cleanRut.substring(0, cleanRut.length() - 1);
        String checkDigit = cleanRut.substring(cleanRut.length() - 1);

        // Formatear con puntos cada 3 dígitos desde la derecha
        StringBuilder formatted = new StringBuilder();
        int count = 0;
        for (int i = number.length() - 1; i >= 0; i--) {
            if (count > 0 && count % 3 == 0) {
                formatted.insert(0, ".");
            }
            formatted.insert(0, number.charAt(i));
            count++;
        }

        return formatted + "-" + checkDigit;
    }

    /**
     * Verifica si existe un cliente con el teléfono dado
     */
    private boolean existsByPhone(String phone) {
        try {
            List<ClientEntity> clients = clientRepository.findAll();
            return clients.stream().anyMatch(c -> c.getPhone().equals(phone));
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * MEJORA DE CALIDAD: Validación de unicidad de email (NO en requisitos originales)
     * Verifica si existe un cliente con el email dado
     */
    private boolean existsByEmail(String email) {
        try {
            List<ClientEntity> clients = clientRepository.findAll();
            return clients.stream().anyMatch(c -> c.getEmail().equalsIgnoreCase(email));
        } catch (Exception e) {
            return false;
        }
    }
}