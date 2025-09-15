package com.toolrent.backend.controllers;

import com.toolrent.backend.entities.RateEntity;
import com.toolrent.backend.entities.UserEntity;
import com.toolrent.backend.services.RateService;
import com.toolrent.backend.services.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/rates")
public class RateController {

    private final RateService rateService;
    private final UserService userService;

    public RateController(RateService rateService, UserService userService) {
        this.rateService = rateService;
        this.userService = userService;
    }

    // RF4.1, RF4.2, RF4.3: Crear tarifas (solo Administrador)
    @PostMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<RateEntity> createRate(@RequestBody RateEntity rate,
                                                 @RequestHeader("X-User-Id") Long userId) {
        UserEntity createdBy = userService.getUserById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        RateEntity createdRate = rateService.createRate(rate, createdBy);
        return ResponseEntity.ok(createdRate);
    }

    // Obtener tarifa actual de arriendo
    @GetMapping("/current/rental")
    public ResponseEntity<BigDecimal> getCurrentRentalRate() {
        BigDecimal rate = rateService.getCurrentRentalRate();
        return ResponseEntity.ok(rate);
    }

    // Obtener tarifa actual de multa por atraso
    @GetMapping("/current/late-fee")
    public ResponseEntity<BigDecimal> getCurrentLateFeeRate() {
        BigDecimal rate = rateService.getCurrentLateFeeRate();
        return ResponseEntity.ok(rate);
    }

    // Obtener tarifa actual de reparación
    @GetMapping("/current/repair")
    public ResponseEntity<BigDecimal> getCurrentRepairRate() {
        BigDecimal rate = rateService.getCurrentRepairRate();
        return ResponseEntity.ok(rate);
    }

    // Obtener todas las tarifas
    @GetMapping
    public ResponseEntity<List<RateEntity>> getAllRates() {
        List<RateEntity> rates = rateService.getAllRates();
        return ResponseEntity.ok(rates);
    }

    // Obtener tarifa por ID
    @GetMapping("/{id}")
    public ResponseEntity<RateEntity> getRateById(@PathVariable Long id) {
        RateEntity rate = rateService.getRateById(id);
        return ResponseEntity.ok(rate);
    }

    // Obtener tarifas por tipo
    @GetMapping("/type/{type}")
    public ResponseEntity<List<RateEntity>> getRatesByType(@PathVariable RateEntity.RateType type) {
        List<RateEntity> rates = rateService.getRatesByType(type);
        return ResponseEntity.ok(rates);
    }

    // Actualizar tarifa (solo Administrador)
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<RateEntity> updateRate(@PathVariable Long id,
                                                 @RequestBody RateEntity rateDetails,
                                                 @RequestHeader("X-User-Id") Long userId) {
        UserEntity updatedBy = userService.getUserById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        RateEntity updatedRate = rateService.updateRate(id, rateDetails, updatedBy);
        return ResponseEntity.ok(updatedRate);
    }

    // Desactivar tarifa (solo Administrador)
    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<RateEntity> deactivateRate(@PathVariable Long id) {
        RateEntity rate = rateService.deactivateRate(id);
        return ResponseEntity.ok(rate);
    }

    // Calcular costo de reparación
    @PostMapping("/calculate-repair")
    public ResponseEntity<BigDecimal> calculateRepairCost(@RequestParam BigDecimal replacementValue) {
        BigDecimal repairCost = rateService.calculateRepairCost(replacementValue);
        return ResponseEntity.ok(repairCost);
    }

    // Obtener tarifas en rango de fechas
    @GetMapping("/date-range")
    public ResponseEntity<List<RateEntity>> getRatesInDateRange(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        List<RateEntity> rates = rateService.getRatesInDateRange(startDate, endDate);
        return ResponseEntity.ok(rates);
    }

    // Verificar si existe tarifa activa por tipo
    @GetMapping("/exists/active/{type}")
    public ResponseEntity<Boolean> hasActiveRate(@PathVariable RateEntity.RateType type) {
        boolean exists = rateService.hasActiveRate(type);
        return ResponseEntity.ok(exists);
    }

    // Obtener historial de tarifas
    @GetMapping("/history/{type}")
    public ResponseEntity<List<RateEntity>> getRateHistory(@PathVariable RateEntity.RateType type) {
        List<RateEntity> history = rateService.getRateHistory(type);
        return ResponseEntity.ok(history);
    }
}