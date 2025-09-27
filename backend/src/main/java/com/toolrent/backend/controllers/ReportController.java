package com.toolrent.backend.controllers;

import com.toolrent.backend.dto.ActiveLoansReportDTO;
import com.toolrent.backend.dto.OverdueClientsReportDTO;
import com.toolrent.backend.dto.PopularToolsReportDTO;
import com.toolrent.backend.dto.ReportSummaryDTO;
import com.toolrent.backend.services.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/reports")
@CrossOrigin("*")
public class ReportController {

    @Autowired
    private ReportService reportService;

    /**
     * RF6.1: Listar préstamos activos y su estado (vigentes, atrasados)
     */
    @GetMapping("/active-loans")
    public ResponseEntity<ActiveLoansReportDTO> getActiveLoansReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        try {
            ActiveLoansReportDTO report = reportService.getActiveLoansReport(startDate, endDate);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * RF6.2: Listar clientes con atrasos
     */
    @GetMapping("/overdue-clients")
    public ResponseEntity<OverdueClientsReportDTO> getOverdueClientsReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        try {
            OverdueClientsReportDTO report = reportService.getOverdueClientsReport(startDate, endDate);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * RF6.3: Ranking herramientas más prestadas
     */
    @GetMapping("/popular-tools")
    public ResponseEntity<PopularToolsReportDTO> getPopularToolsReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "10") int limit) {

        try {
            PopularToolsReportDTO report = reportService.getPopularToolsReport(startDate, endDate, limit);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Resumen general de todos los reportes
     */
    @GetMapping("/summary")
    public ResponseEntity<ReportSummaryDTO> getReportSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        try {
            ReportSummaryDTO summary = reportService.getGeneralSummary(startDate, endDate);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
