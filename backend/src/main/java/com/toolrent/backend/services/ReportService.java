package com.toolrent.backend.services;

import com.toolrent.backend.dto.*;
import com.toolrent.backend.entities.LoanEntity;
import com.toolrent.backend.entities.ClientEntity;
import com.toolrent.backend.repositories.LoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private LoanRepository loanRepository;

    // Constante para cálculo de multas (5 pesos por día de atraso)
    private static final double FINE_PER_DAY = 5.0;

    /**
     * RF6.1: Generar reporte de préstamos activos
     */
    public ActiveLoansReportDTO getActiveLoansReport(LocalDate startDate, LocalDate endDate) {
        List<LoanEntity> loans = getLoansInPeriod(startDate, endDate);

        // Filtrar solo préstamos activos (no devueltos)
        List<LoanEntity> activeLoans = loans.stream()
                .filter(loan -> loan.getActualReturnDate() == null)
                .collect(Collectors.toList());

        List<ActiveLoansReportDTO.ActiveLoanDTO> activeLoanDTOs = activeLoans.stream()
                .map(this::mapToActiveLoanDTO)
                .collect(Collectors.toList());

        // Calcular resumen
        int total = activeLoanDTOs.size();
        int active = (int) activeLoanDTOs.stream().filter(loan -> !loan.isOverdue()).count();
        int overdue = (int) activeLoanDTOs.stream().filter(ActiveLoansReportDTO.ActiveLoanDTO::isOverdue).count();
        double avgDaysOverdue = activeLoanDTOs.stream()
                .filter(ActiveLoansReportDTO.ActiveLoanDTO::isOverdue)
                .mapToInt(ActiveLoansReportDTO.ActiveLoanDTO::getDaysOverdue)
                .average()
                .orElse(0.0);

        ActiveLoansReportDTO.ActiveLoansSummaryDTO summary =
                new ActiveLoansReportDTO.ActiveLoansSummaryDTO(total, active, overdue, avgDaysOverdue);

        // Información del período
        Integer totalDays = (startDate != null && endDate != null) ?
                (int) ChronoUnit.DAYS.between(startDate, endDate) + 1 : null;
        ActiveLoansReportDTO.ReportPeriodDTO period =
                new ActiveLoansReportDTO.ReportPeriodDTO(startDate, endDate, totalDays);

        return new ActiveLoansReportDTO(activeLoanDTOs, summary, period);
    }

    /**
     * RF6.2: Generar reporte de clientes con atrasos
     */
    public OverdueClientsReportDTO getOverdueClientsReport(LocalDate startDate, LocalDate endDate) {
        List<LoanEntity> loans = getLoansInPeriod(startDate, endDate);

        // Filtrar préstamos atrasados
        List<LoanEntity> overdueLoans = loans.stream()
                .filter(loan -> loan.getActualReturnDate() == null && isLoanOverdue(loan))
                .collect(Collectors.toList());

        // Agrupar por cliente
        Map<ClientEntity, List<LoanEntity>> loansByClient = overdueLoans.stream()
                .collect(Collectors.groupingBy(LoanEntity::getClient));

        List<OverdueClientsReportDTO.OverdueClientDTO> overdueClients = loansByClient.entrySet().stream()
                .map(entry -> mapToOverdueClientDTO(entry.getKey(), entry.getValue()))
                .sorted((a, b) -> Integer.compare(b.getMaxDaysOverdue(), a.getMaxDaysOverdue()))
                .collect(Collectors.toList());

        // Calcular resumen
        int totalClients = overdueClients.size();
        int totalOverdueLoans = overdueLoans.size();
        double totalOverdueAmount = overdueClients.stream()
                .mapToDouble(OverdueClientsReportDTO.OverdueClientDTO::getTotalOverdueAmount)
                .sum();
        double avgDaysOverdue = overdueClients.stream()
                .mapToDouble(OverdueClientsReportDTO.OverdueClientDTO::getAvgDaysOverdue)
                .average()
                .orElse(0.0);

        OverdueClientsReportDTO.OverdueClientsSummaryDTO summary =
                new OverdueClientsReportDTO.OverdueClientsSummaryDTO(totalClients, totalOverdueLoans, totalOverdueAmount, avgDaysOverdue);

        return new OverdueClientsReportDTO(overdueClients, summary);
    }

    /**
     * RF6.3: Generar reporte de herramientas más prestadas
     */
    public PopularToolsReportDTO getPopularToolsReport(LocalDate startDate, LocalDate endDate, int limit) {
        List<LoanEntity> loans = getLoansInPeriod(startDate, endDate);

        // Agrupar por herramienta y calcular estadísticas
        Map<String, List<LoanEntity>> loansByTool = loans.stream()
                .filter(loan -> loan.getTool() != null)
                .collect(Collectors.groupingBy(loan -> loan.getTool().getName()));

        List<PopularToolsReportDTO.PopularToolDTO> popularTools = loansByTool.entrySet().stream()
                .map(entry -> mapToPopularToolDTO(entry.getKey(), entry.getValue()))
                .sorted((a, b) -> Integer.compare(b.getTotalLoans(), a.getTotalLoans()))
                .limit(limit)
                .collect(Collectors.toList());

        // Calcular resumen
        int totalToolsAnalyzed = loansByTool.size();
        int totalLoansAnalyzed = loans.size();
        PopularToolsReportDTO.MostPopularToolDTO mostPopularTool = popularTools.isEmpty() ? null :
                new PopularToolsReportDTO.MostPopularToolDTO(
                        popularTools.get(0).getId(),
                        popularTools.get(0).getName(),
                        popularTools.get(0).getTotalLoans()
                );
        double avgLoansPerTool = totalToolsAnalyzed > 0 ? (double) totalLoansAnalyzed / totalToolsAnalyzed : 0.0;

        PopularToolsReportDTO.PopularToolsSummaryDTO summary =
                new PopularToolsReportDTO.PopularToolsSummaryDTO(totalToolsAnalyzed, totalLoansAnalyzed, mostPopularTool, avgLoansPerTool);

        // Información del período
        Integer totalDays = (startDate != null && endDate != null) ?
                (int) ChronoUnit.DAYS.between(startDate, endDate) + 1 : null;
        PopularToolsReportDTO.ReportPeriodDTO period =
                new PopularToolsReportDTO.ReportPeriodDTO(startDate, endDate, totalDays);

        return new PopularToolsReportDTO(popularTools, summary, period);
    }

    /**
     * Generar resumen general de reportes
     */
    public ReportSummaryDTO getGeneralSummary(LocalDate startDate, LocalDate endDate) {
        // Obtener datos de todos los reportes
        ActiveLoansReportDTO activeLoansReport = getActiveLoansReport(startDate, endDate);
        OverdueClientsReportDTO overdueClientsReport = getOverdueClientsReport(startDate, endDate);
        PopularToolsReportDTO popularToolsReport = getPopularToolsReport(startDate, endDate, 5);

        // Construir período
        boolean isCustomRange = (startDate != null && endDate != null);
        ReportSummaryDTO.ReportPeriodDTO period =
                new ReportSummaryDTO.ReportPeriodDTO(startDate, endDate, isCustomRange);

        // Resúmenes simplificados
        ReportSummaryDTO.ActiveLoansSummaryDTO activeLoansSum =
                new ReportSummaryDTO.ActiveLoansSummaryDTO(
                        activeLoansReport.getSummary().getTotal(),
                        activeLoansReport.getSummary().getActive(),
                        activeLoansReport.getSummary().getOverdue()
                );

        ReportSummaryDTO.OverdueClientsSummaryDTO overdueClientsSum =
                new ReportSummaryDTO.OverdueClientsSummaryDTO(
                        overdueClientsReport.getSummary().getTotalClients(),
                        overdueClientsReport.getSummary().getTotalOverdueAmount()
                );

        ReportSummaryDTO.MostPopularToolDTO mostPopularTool = null;
        if (popularToolsReport.getSummary().getMostPopularTool() != null) {
            mostPopularTool = new ReportSummaryDTO.MostPopularToolDTO(
                    popularToolsReport.getSummary().getMostPopularTool().getName(),
                    popularToolsReport.getSummary().getMostPopularTool().getTotalLoans()
            );
        }
        ReportSummaryDTO.PopularToolsSummaryDTO popularToolsSum =
                new ReportSummaryDTO.PopularToolsSummaryDTO(mostPopularTool);

        // Alertas
        int criticalOverdue = (int) overdueClientsReport.getClients().stream()
                .filter(client -> client.getMaxDaysOverdue() > 7)
                .count();
        int highDemandTools = (int) popularToolsReport.getTools().stream()
                .filter(tool -> tool.getTotalLoans() > 20)
                .count();
        int riskyClients = (int) overdueClientsReport.getClients().stream()
                .filter(client -> client.getLoansCount() > 1)
                .count();

        ReportSummaryDTO.AlertsDTO alerts =
                new ReportSummaryDTO.AlertsDTO(criticalOverdue, highDemandTools, riskyClients);

        return new ReportSummaryDTO(period, activeLoansSum, overdueClientsSum, popularToolsSum, alerts);
    }

    // Métodos auxiliares privados

    private List<LoanEntity> getLoansInPeriod(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null) {
            return loanRepository.findByLoanDateBetween(startDate, endDate);
        } else if (startDate != null) {
            // Si solo hay fecha de inicio, obtener todos y filtrar en el servicio
            return loanRepository.findAll().stream()
                    .filter(loan -> !loan.getLoanDate().isBefore(startDate))
                    .collect(Collectors.toList());
        } else if (endDate != null) {
            // Si solo hay fecha de fin, obtener todos y filtrar en el servicio
            return loanRepository.findAll().stream()
                    .filter(loan -> !loan.getLoanDate().isAfter(endDate))
                    .collect(Collectors.toList());
        } else {
            return loanRepository.findAll();
        }
    }

    private boolean isLoanOverdue(LoanEntity loan) {
        return loan.getAgreedReturnDate() != null &&
               loan.getAgreedReturnDate().isBefore(LocalDate.now());
    }

    private int calculateDaysOverdue(LoanEntity loan) {
        if (!isLoanOverdue(loan)) return 0;
        return (int) ChronoUnit.DAYS.between(loan.getAgreedReturnDate(), LocalDate.now());
    }

    private ActiveLoansReportDTO.ActiveLoanDTO mapToActiveLoanDTO(LoanEntity loan) {
        boolean overdue = isLoanOverdue(loan);
        int daysOverdue = calculateDaysOverdue(loan);
        String status = overdue ? "OVERDUE" : "ACTIVE";

        String clientName = loan.getClient() != null ?
                loan.getClient().getName() : "Cliente desconocido";
        String toolName = loan.getTool() != null ? loan.getTool().getName() : "Herramienta desconocida";
        String categoryName = (loan.getTool() != null && loan.getTool().getCategory() != null) ?
                loan.getTool().getCategory().getName() : "Categoría desconocida";

        return new ActiveLoansReportDTO.ActiveLoanDTO(
                loan.getId(),
                clientName,
                toolName,
                categoryName,
                loan.getQuantity(),
                loan.getLoanDate(),
                loan.getAgreedReturnDate(),
                status,
                overdue,
                daysOverdue,
                loan.getNotes()
        );
    }

    private OverdueClientsReportDTO.OverdueClientDTO mapToOverdueClientDTO(ClientEntity client, List<LoanEntity> overdueLoans) {
        String clientName = client.getName();

        List<OverdueClientsReportDTO.OverdueLoanDTO> overdueLoanDTOs = overdueLoans.stream()
                .map(loan -> {
                    int daysOverdue = calculateDaysOverdue(loan);
                    double fineAmount = daysOverdue * FINE_PER_DAY;
                    String toolName = loan.getTool() != null ? loan.getTool().getName() : "Herramienta desconocida";
                    return new OverdueClientsReportDTO.OverdueLoanDTO(loan.getId(), toolName, daysOverdue, fineAmount);
                })
                .collect(Collectors.toList());

        int loansCount = overdueLoans.size();
        int maxDaysOverdue = overdueLoanDTOs.stream()
                .mapToInt(OverdueClientsReportDTO.OverdueLoanDTO::getDaysOverdue)
                .max()
                .orElse(0);
        double avgDaysOverdue = overdueLoanDTOs.stream()
                .mapToInt(OverdueClientsReportDTO.OverdueLoanDTO::getDaysOverdue)
                .average()
                .orElse(0.0);
        double totalOverdueAmount = overdueLoanDTOs.stream()
                .mapToDouble(OverdueClientsReportDTO.OverdueLoanDTO::getFineAmount)
                .sum();

        return new OverdueClientsReportDTO.OverdueClientDTO(
                client.getId(),
                clientName,
                client.getEmail(),
                client.getPhone(),
                loansCount,
                maxDaysOverdue,
                avgDaysOverdue,
                totalOverdueAmount,
                overdueLoanDTOs
        );
    }

    private PopularToolsReportDTO.PopularToolDTO mapToPopularToolDTO(String toolName, List<LoanEntity> toolLoans) {
        // Obtener datos de la primera herramienta (asumiendo que todas tienen el mismo nombre)
        LoanEntity firstLoan = toolLoans.get(0);
        Long toolId = firstLoan.getTool().getId();
        String categoryName = (firstLoan.getTool().getCategory() != null) ?
                firstLoan.getTool().getCategory().getName() : "Categoría desconocida";

        int totalLoans = toolLoans.size();
        int totalQuantity = toolLoans.stream()
                .mapToInt(loan -> loan.getQuantity() != null ? loan.getQuantity() : 1)
                .sum();

        Set<Long> uniqueClientIds = toolLoans.stream()
                .map(loan -> loan.getClient().getId())
                .collect(Collectors.toSet());
        int uniqueClients = uniqueClientIds.size();

        // Calcular duración promedio de préstamos
        double avgLoanDuration = toolLoans.stream()
                .filter(loan -> loan.getActualReturnDate() != null)
                .mapToLong(loan -> ChronoUnit.DAYS.between(loan.getLoanDate(), loan.getActualReturnDate()))
                .average()
                .orElse(0.0);

        // Calcular score de popularidad (fórmula: totalLoans * 2 + uniqueClients * 1.5)
        double popularityScore = totalLoans * 2.0 + uniqueClients * 1.5;

        return new PopularToolsReportDTO.PopularToolDTO(
                toolId,
                toolName,
                categoryName,
                totalLoans,
                totalQuantity,
                uniqueClients,
                avgLoanDuration,
                popularityScore
        );
    }
}
