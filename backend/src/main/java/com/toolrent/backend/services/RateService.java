package com.toolrent.backend.services;

import com.toolrent.backend.entities.RateEntity;
import com.toolrent.backend.repositories.RateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class RateService {

    @Autowired
    private RateRepository rateRepository;

    // MÉTODOS BÁSICOS PARA OBTENER TARIFAS ACTUALES - VERSIÓN CORREGIDA

    @Transactional(readOnly = true)
    public BigDecimal getCurrentRentalRate() {
        try {
            System.out.println("Buscando tarifa de arriendo actual...");

            Optional<RateEntity> rate = rateRepository.findCurrentActiveRateByType(RateEntity.RateType.RENTAL_RATE);
            if (rate.isPresent()) {
                System.out.println("Tarifa encontrada: $" + rate.get().getDailyAmount());
                return rate.get().getDailyAmount();
            } else {
                System.out.println("No se encontró tarifa de arriendo, creando tarifa por defecto...");
                // Crear tarifa por defecto de forma segura
                createDefaultRentalRateIfNeeded();
                // Retornar valor por defecto en lugar de recursión
                return BigDecimal.valueOf(5000.0);
            }
        } catch (Exception e) {
            System.err.println("Error obteniendo tarifa de arriendo: " + e.getMessage());
            e.printStackTrace();
            // Retornar valor por defecto en caso de error
            return BigDecimal.valueOf(5000.0);
        }
    }

    @Transactional(readOnly = true)
    public BigDecimal getCurrentLateFeeRate() {
        try {
            System.out.println("Buscando tarifa de multa actual...");

            Optional<RateEntity> rate = rateRepository.findCurrentActiveRateByType(RateEntity.RateType.LATE_FEE_RATE);
            if (rate.isPresent()) {
                System.out.println("Tarifa de multa encontrada: $" + rate.get().getDailyAmount());
                return rate.get().getDailyAmount();
            } else {
                System.out.println("No se encontró tarifa de multa, creando tarifa por defecto...");
                createDefaultLateFeeRateIfNeeded();
                return BigDecimal.valueOf(2000.0);
            }
        } catch (Exception e) {
            System.err.println("Error obteniendo tarifa de multa: " + e.getMessage());
            e.printStackTrace();
            return BigDecimal.valueOf(2000.0);
        }
    }

    @Transactional(readOnly = true)
    public BigDecimal getCurrentRepairRate() {
        try {
            System.out.println("Buscando tarifa de reparación actual...");

            Optional<RateEntity> rate = rateRepository.findCurrentActiveRateByType(RateEntity.RateType.REPAIR_RATE);
            if (rate.isPresent()) {
                System.out.println("Tarifa de reparación encontrada: " + rate.get().getDailyAmount());
                return rate.get().getDailyAmount();
            } else {
                System.out.println("No se encontró tarifa de reparación, creando tarifa por defecto...");
                createDefaultRepairRateIfNeeded();
                return BigDecimal.valueOf(0.2); // 20%
            }
        } catch (Exception e) {
            System.err.println("Error obteniendo tarifa de reparación: " + e.getMessage());
            e.printStackTrace();
            return BigDecimal.valueOf(0.2);
        }
    }

    // MÉTODOS PARA CREAR TARIFAS POR DEFECTO - VERSIÓN SEGURA SIN RECURSIÓN

    @Transactional
    private void createDefaultRentalRateIfNeeded() {
        try {
            // Verificar si ya existe una tarifa activa
            boolean exists = rateRepository.existsByTypeAndActiveTrue(RateEntity.RateType.RENTAL_RATE);
            if (exists) {
                System.out.println("Ya existe una tarifa de arriendo activa");
                return;
            }

            RateEntity rate = new RateEntity();
            rate.setType(RateEntity.RateType.RENTAL_RATE);
            rate.setDailyAmount(BigDecimal.valueOf(5000.0));
            rate.setEffectiveFrom(LocalDate.now());
            rate.setActive(true);
            rate.setCreatedBy("system");

            rateRepository.save(rate);
            System.out.println("Tarifa de arriendo por defecto creada: $5000");
        } catch (Exception e) {
            System.err.println("Error creando tarifa de arriendo por defecto: " + e.getMessage());
        }
    }

    @Transactional
    private void createDefaultLateFeeRateIfNeeded() {
        try {
            boolean exists = rateRepository.existsByTypeAndActiveTrue(RateEntity.RateType.LATE_FEE_RATE);
            if (exists) {
                System.out.println("Ya existe una tarifa de multa activa");
                return;
            }

            RateEntity rate = new RateEntity();
            rate.setType(RateEntity.RateType.LATE_FEE_RATE);
            rate.setDailyAmount(BigDecimal.valueOf(2000.0));
            rate.setEffectiveFrom(LocalDate.now());
            rate.setActive(true);
            rate.setCreatedBy("system");

            rateRepository.save(rate);
            System.out.println("Tarifa de multa por defecto creada: $2000");
        } catch (Exception e) {
            System.err.println("Error creando tarifa de multa por defecto: " + e.getMessage());
        }
    }

    @Transactional
    private void createDefaultRepairRateIfNeeded() {
        try {
            boolean exists = rateRepository.existsByTypeAndActiveTrue(RateEntity.RateType.REPAIR_RATE);
            if (exists) {
                System.out.println("Ya existe una tarifa de reparación activa");
                return;
            }

            RateEntity rate = new RateEntity();
            rate.setType(RateEntity.RateType.REPAIR_RATE);
            rate.setDailyAmount(BigDecimal.valueOf(0.2)); // 20%
            rate.setEffectiveFrom(LocalDate.now());
            rate.setActive(true);
            rate.setCreatedBy("system");

            rateRepository.save(rate);
            System.out.println("Tarifa de reparación por defecto creada: 20%");
        } catch (Exception e) {
            System.err.println("Error creando tarifa de reparación por defecto: " + e.getMessage());
        }
    }

    // MÉTODOS CRUD BÁSICOS

    public List<RateEntity> getAllRates() {
        return rateRepository.findAll();
    }

    public RateEntity getRateById(Long id) {
        return rateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tarifa no encontrada con ID: " + id));
    }

    @Transactional
    public RateEntity createRate(RateEntity rate) {
        try {
            // Validaciones básicas
            if (rate.getType() == null) {
                throw new RuntimeException("Tipo de tarifa es requerido");
            }
            if (rate.getDailyAmount() == null || rate.getDailyAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("Monto diario debe ser mayor a 0");
            }
            if (rate.getEffectiveFrom() == null) {
                throw new RuntimeException("Fecha de inicio es requerida");
            }

            // Establecer valores por defecto
            if (rate.getCreatedBy() == null || rate.getCreatedBy().trim().isEmpty()) {
                rate.setCreatedBy("system");
            }
            if (rate.getCreatedAt() == null) {
                rate.setCreatedAt(LocalDateTime.now());
            }
            if (rate.getActive() == null) {
                rate.setActive(true);
            }

            return rateRepository.save(rate);
        } catch (Exception e) {
            System.err.println("Error creando tarifa: " + e.getMessage());
            throw new RuntimeException("Error al crear tarifa: " + e.getMessage());
        }
    }

    @Transactional
    public RateEntity updateRate(Long id, RateEntity rateDetails) {
        try {
            RateEntity rate = getRateById(id);

            if (rateDetails.getDailyAmount() != null) {
                rate.setDailyAmount(rateDetails.getDailyAmount());
            }
            if (rateDetails.getEffectiveFrom() != null) {
                rate.setEffectiveFrom(rateDetails.getEffectiveFrom());
            }
            if (rateDetails.getEffectiveTo() != null) {
                rate.setEffectiveTo(rateDetails.getEffectiveTo());
            }
            if (rateDetails.getActive() != null) {
                rate.setActive(rateDetails.getActive());
            }

            return rateRepository.save(rate);
        } catch (Exception e) {
            System.err.println("Error actualizando tarifa: " + e.getMessage());
            throw new RuntimeException("Error al actualizar tarifa: " + e.getMessage());
        }
    }

    @Transactional
    public RateEntity deactivateRate(Long id) {
        try {
            RateEntity rate = getRateById(id);
            rate.setActive(false);
            return rateRepository.save(rate);
        } catch (Exception e) {
            System.err.println("Error desactivando tarifa: " + e.getMessage());
            throw new RuntimeException("Error al desactivar tarifa: " + e.getMessage());
        }
    }

    // MÉTODOS ADICIONALES

    public List<RateEntity> getRatesByType(RateEntity.RateType type) {
        return rateRepository.findByType(type);
    }

    public boolean hasActiveRate(RateEntity.RateType type) {
        return rateRepository.existsByTypeAndActiveTrue(type);
    }

    public BigDecimal calculateRepairCost(BigDecimal replacementValue) {
        try {
            BigDecimal repairRate = getCurrentRepairRate();
            return replacementValue.multiply(repairRate.divide(new BigDecimal("100")));
        } catch (Exception e) {
            System.err.println("Error calculando costo de reparación: " + e.getMessage());
            throw new RuntimeException("Error al calcular costo de reparación: " + e.getMessage());
        }
    }

    public List<RateEntity> getRatesInDateRange(LocalDate startDate, LocalDate endDate) {
        return rateRepository.findRatesInDateRange(startDate, endDate);
    }

    public List<RateEntity> getRateHistory(RateEntity.RateType type) {
        return rateRepository.findByType(type);
    }
}

