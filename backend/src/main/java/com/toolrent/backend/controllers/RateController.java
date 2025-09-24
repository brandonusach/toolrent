package com.toolrent.backend.controllers;

import com.toolrent.backend.entities.RateEntity;
import com.toolrent.backend.services.RateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/rates")
@CrossOrigin("*")
public class RateController {

    @Autowired
    private RateService rateService;

    // ENDPOINTS BÁSICOS PARA TARIFAS ACTUALES

    @GetMapping("/current/rental")
    public ResponseEntity<?> getCurrentRentalRate() {
        try {
            System.out.println("Obteniendo tarifa de arriendo actual...");
            BigDecimal rate = rateService.getCurrentRentalRate();

            Map<String, Object> response = new HashMap<>();
            response.put("rate", rate);
            response.put("success", true);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error en getCurrentRentalRate: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("success", false);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/current/late-fee")
    public ResponseEntity<?> getCurrentLateFeeRate() {
        try {
            System.out.println("Obteniendo tarifa de multa actual...");
            BigDecimal rate = rateService.getCurrentLateFeeRate();

            Map<String, Object> response = new HashMap<>();
            response.put("rate", rate);
            response.put("success", true);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error en getCurrentLateFeeRate: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("success", false);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/current/repair")
    public ResponseEntity<?> getCurrentRepairRate() {
        try {
            System.out.println("Obteniendo tarifa de reparación actual...");
            BigDecimal rate = rateService.getCurrentRepairRate();

            Map<String, Object> response = new HashMap<>();
            response.put("rate", rate);
            response.put("success", true);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error en getCurrentRepairRate: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("success", false);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ENDPOINTS CRUD BÁSICOS

    @GetMapping("/")
    public ResponseEntity<?> listRates() {
        try {
            System.out.println("Listando todas las tarifas...");
            List<RateEntity> rates = rateService.getAllRates();
            return ResponseEntity.ok(rates);
        } catch (Exception e) {
            System.err.println("Error listando tarifas: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRateById(@PathVariable Long id) {
        try {
            System.out.println("Obteniendo tarifa con ID: " + id);
            RateEntity rate = rateService.getRateById(id);
            return ResponseEntity.ok(rate);
        } catch (RuntimeException e) {
            System.err.println("Tarifa no encontrada con ID: " + id);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Tarifa no encontrada");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            System.err.println("Error obteniendo tarifa: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/")
    public ResponseEntity<?> saveRate(@RequestBody RateEntity rate) {
        try {
            System.out.println("Creando nueva tarifa: " + rate);
            RateEntity newRate = rateService.createRate(rate);
            return ResponseEntity.ok(newRate);
        } catch (RuntimeException e) {
            System.err.println("Error de validación creando tarifa: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            System.err.println("Error interno creando tarifa: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error interno del servidor: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping("/")
    public ResponseEntity<?> updateRate(@RequestBody RateEntity rate) {
        try {
            System.out.println("Actualizando tarifa: " + rate);
            if (rate.getId() == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "ID de tarifa es requerido para actualizar");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            RateEntity updatedRate = rateService.updateRate(rate.getId(), rate);
            return ResponseEntity.ok(updatedRate);
        } catch (RuntimeException e) {
            System.err.println("Error actualizando tarifa: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            System.err.println("Error interno actualizando tarifa: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error interno del servidor: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRateById(@PathVariable Long id) {
        try {
            System.out.println("Desactivando tarifa con ID: " + id);
            RateEntity deactivatedRate = rateService.deactivateRate(id);
            return ResponseEntity.ok(deactivatedRate);
        } catch (RuntimeException e) {
            System.err.println("Error desactivando tarifa: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            System.err.println("Error interno desactivando tarifa: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error interno del servidor: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ENDPOINTS ADICIONALES

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivateRate(@PathVariable Long id) {
        try {
            System.out.println("Desactivando tarifa con ID: " + id);
            RateEntity rate = rateService.deactivateRate(id);
            return ResponseEntity.ok(rate);
        } catch (Exception e) {
            System.err.println("Error desactivando tarifa: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<?> getRatesByType(@PathVariable String type) {
        try {
            System.out.println("Obteniendo tarifas por tipo: " + type);
            RateEntity.RateType rateType = RateEntity.RateType.valueOf(type.toUpperCase());
            List<RateEntity> rates = rateService.getRatesByType(rateType);
            return ResponseEntity.ok(rates);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Tipo de tarifa inválido: " + type);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/calculate-repair")
    public ResponseEntity<?> calculateRepairCost(@RequestParam BigDecimal replacementValue) {
        try {
            System.out.println("Calculando costo de reparación para valor: " + replacementValue);
            BigDecimal repairCost = rateService.calculateRepairCost(replacementValue);

            Map<String, Object> response = new HashMap<>();
            response.put("repairCost", repairCost);
            response.put("success", true);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error calculando costo de reparación: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @GetMapping("/history/{type}")
    public ResponseEntity<?> getRateHistory(@PathVariable String type) {
        try {
            System.out.println("Obteniendo historial de tarifas para tipo: " + type);
            RateEntity.RateType rateType = RateEntity.RateType.valueOf(type.toUpperCase());
            List<RateEntity> history = rateService.getRateHistory(rateType);
            return ResponseEntity.ok(history);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Tipo de tarifa inválido: " + type);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/exists/active/{type}")
    public ResponseEntity<?> hasActiveRate(@PathVariable String type) {
        try {
            RateEntity.RateType rateType = RateEntity.RateType.valueOf(type.toUpperCase());
            boolean exists = rateService.hasActiveRate(rateType);

            Map<String, Object> response = new HashMap<>();
            response.put("exists", exists);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Tipo de tarifa inválido: " + type);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/date-range")
    public ResponseEntity<?> getRatesInDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        try {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            List<RateEntity> rates = rateService.getRatesInDateRange(start, end);
            return ResponseEntity.ok(rates);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error procesando fechas: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    // ENDPOINT DE PRUEBA
    @GetMapping("/test")
    public ResponseEntity<?> testEndpoint() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Rate controller está funcionando");
        response.put("timestamp", java.time.LocalDateTime.now());
        return ResponseEntity.ok(response);
    }
}