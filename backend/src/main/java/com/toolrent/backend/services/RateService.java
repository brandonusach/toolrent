package com.toolrent.backend.services;

import com.toolrent.backend.entities.RateEntity;
import com.toolrent.backend.entities.UserEntity;
import com.toolrent.backend.repositories.RateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class RateService {

    private final RateRepository rateRepository;

    public RateService(RateRepository rateRepository) {
        this.rateRepository = rateRepository;
    }

    // RF4.1: Configurar tarifa diaria de arriendo (solo Administrador)
    // RF4.2: Configurar tarifa diaria de multa por atraso (solo Administrador)
    @Transactional
    public RateEntity createRate(RateEntity rate, UserEntity createdBy) {
        validateRateCreation(rate);

        // Set createdBy user
        rate.setCreatedBy(createdBy);

        // Deactivate other rates of same type that overlap
        deactivateOverlappingRates(rate);

        return rateRepository.save(rate);
    }

    // Get current active rental rate
    public BigDecimal getCurrentRentalRate() {
        return getCurrentRateByType(RateEntity.RateType.RENTAL_RATE)
                .orElseThrow(() -> new RuntimeException("No hay tarifa de arriendo activa configurada"));
    }

    // Get current active late fee rate
    public BigDecimal getCurrentLateFeeRate() {
        return getCurrentRateByType(RateEntity.RateType.LATE_FEE_RATE)
                .orElseThrow(() -> new RuntimeException("No hay tarifa de multa por atraso activa configurada"));
    }

    // Get current active repair rate (percentage)
    public BigDecimal getCurrentRepairRate() {
        return getCurrentRateByType(RateEntity.RateType.REPAIR_RATE)
                .orElseThrow(() -> new RuntimeException("No hay tarifa de reparación activa configurada"));
    }

    // Get rate by ID
    public RateEntity getRateById(Long id) {
        return rateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tarifa no encontrada con ID: " + id));
    }

    // Get all rates
    public List<RateEntity> getAllRates() {
        return rateRepository.findAll();
    }

    // Get rates by type
    public List<RateEntity> getRatesByType(RateEntity.RateType type) {
        return rateRepository.findByType(type);
    }

    // Get active rates
    public List<RateEntity> getActiveRates() {
        return rateRepository.findByActive(true);
    }

    // Get current active rate by type
    public Optional<BigDecimal> getCurrentRateByType(RateEntity.RateType type) {
        return rateRepository.findCurrentActiveRateByType(type)
                .map(RateEntity::getDailyAmount);
    }

    // Update rate (only Administrators)
    @Transactional
    public RateEntity updateRate(Long id, RateEntity rateDetails, UserEntity updatedBy) {
        RateEntity rate = getRateById(id);

        validateRateUpdate(rate, rateDetails);

        // Update fields
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

        // If activating, deactivate overlapping rates
        if (rate.getActive()) {
            deactivateOverlappingRates(rate);
        }

        return rateRepository.save(rate);
    }

    // Deactivate rate
    @Transactional
    public RateEntity deactivateRate(Long id) {
        RateEntity rate = getRateById(id);
        rate.setActive(false);
        return rateRepository.save(rate);
    }

    // Get rates in date range
    public List<RateEntity> getRatesInDateRange(LocalDate startDate, LocalDate endDate) {
        return rateRepository.findRatesInDateRange(startDate, endDate);
    }

    // Get rates by type in date range
    public List<RateEntity> getRatesByTypeInDateRange(RateEntity.RateType type,
                                                      LocalDate startDate, LocalDate endDate) {
        return rateRepository.findRatesByTypeInDateRange(type, startDate, endDate);
    }

    // Check if rate type has active configuration
    public boolean hasActiveRate(RateEntity.RateType type) {
        return rateRepository.existsByTypeAndActiveTrue(type);
    }

    // Get historical rates for reporting
    public List<RateEntity> getRateHistory(RateEntity.RateType type) {
        return rateRepository.findByType(type);
    }

    // Private validation methods
    private void validateRateCreation(RateEntity rate) {
        if (rate.getType() == null) {
            throw new RuntimeException("Tipo de tarifa es requerido");
        }
        if (rate.getDailyAmount() == null || rate.getDailyAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Monto diario debe ser mayor a 0");
        }
        if (rate.getEffectiveFrom() == null) {
            throw new RuntimeException("Fecha de inicio de vigencia es requerida");
        }
        if (rate.getEffectiveTo() != null && rate.getEffectiveTo().isBefore(rate.getEffectiveFrom())) {
            throw new RuntimeException("Fecha de fin no puede ser anterior a fecha de inicio");
        }

        // Check for overlapping active rates
        if (rate.getActive()) {
            List<RateEntity> overlappingRates = rateRepository.findRatesByTypeInDateRange(
                    rate.getType(),
                    rate.getEffectiveFrom(),
                    rate.getEffectiveTo() != null ? rate.getEffectiveTo() : LocalDate.MAX);

            boolean hasActiveOverlap = overlappingRates.stream()
                    .anyMatch(r -> !r.getId().equals(rate.getId()) && r.getActive());

            if (hasActiveOverlap) {
                throw new RuntimeException("Existe una tarifa activa que se superpone con el rango de fechas");
            }
        }
    }

    private void validateRateUpdate(RateEntity existingRate, RateEntity newRate) {
        if (newRate.getEffectiveTo() != null &&
                newRate.getEffectiveTo().isBefore(existingRate.getEffectiveFrom())) {
            throw new RuntimeException("Fecha de fin no puede ser anterior a fecha de inicio");
        }
    }

    private void deactivateOverlappingRates(RateEntity newRate) {
        List<RateEntity> overlappingRates = rateRepository.findRatesByTypeInDateRange(
                newRate.getType(),
                newRate.getEffectiveFrom(),
                newRate.getEffectiveTo() != null ? newRate.getEffectiveTo() : LocalDate.MAX);

        overlappingRates.stream()
                .filter(r -> !r.getId().equals(newRate.getId()) && r.getActive())
                .forEach(rate -> {
                    rate.setActive(false);
                    rateRepository.save(rate);
                });
    }

    // Calculate repair cost based on replacement value and repair rate
    public BigDecimal calculateRepairCost(BigDecimal replacementValue) {
        BigDecimal repairRate = getCurrentRepairRate();
        return replacementValue.multiply(repairRate.divide(new BigDecimal("100")));
    }

    // Get rate effective for a specific date
    public Optional<BigDecimal> getRateForDate(RateEntity.RateType type, LocalDate date) {
        return rateRepository.findActiveRateByTypeAndDate(type, date)
                .map(RateEntity::getDailyAmount);
    }
}