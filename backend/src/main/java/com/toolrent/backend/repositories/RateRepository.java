package com.toolrent.backend.repositories;

import com.toolrent.backend.entities.RateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RateRepository extends JpaRepository<RateEntity, Long> {

    List<RateEntity> findByType(RateEntity.RateType type);

    List<RateEntity> findByActive(Boolean active);

    List<RateEntity> findByTypeAndActive(RateEntity.RateType type, Boolean active);

    @Query("SELECT r FROM RateEntity r WHERE r.type = :type AND r.active = true " +
            "AND r.effectiveFrom <= :date AND (r.effectiveTo IS NULL OR r.effectiveTo >= :date)")
    Optional<RateEntity> findActiveRateByTypeAndDate(
            @Param("type") RateEntity.RateType type,
            @Param("date") LocalDate date);

    @Query("SELECT r FROM RateEntity r WHERE r.type = :type AND r.active = true " +
            "AND r.effectiveFrom <= CURRENT_DATE AND (r.effectiveTo IS NULL OR r.effectiveTo >= CURRENT_DATE)")
    Optional<RateEntity> findCurrentActiveRateByType(@Param("type") RateEntity.RateType type);

    @Query("SELECT r FROM RateEntity r WHERE r.effectiveFrom <= :endDate " +
            "AND (r.effectiveTo IS NULL OR r.effectiveTo >= :startDate)")
    List<RateEntity> findRatesInDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT r FROM RateEntity r WHERE r.type = :type " +
            "AND r.effectiveFrom <= :endDate AND (r.effectiveTo IS NULL OR r.effectiveTo >= :startDate)")
    List<RateEntity> findRatesByTypeInDateRange(
            @Param("type") RateEntity.RateType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    boolean existsByTypeAndActiveTrue(RateEntity.RateType type);

    @Query("SELECT COUNT(r) FROM RateEntity r WHERE r.type = :type AND r.active = true " +
            "AND r.effectiveFrom <= :date AND (r.effectiveTo IS NULL OR r.effectiveTo >= :date)")
    long countActiveRatesByTypeAndDate(
            @Param("type") RateEntity.RateType type,
            @Param("date") LocalDate date);
}