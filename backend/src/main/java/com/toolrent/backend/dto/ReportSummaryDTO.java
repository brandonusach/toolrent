package com.toolrent.backend.dto;

import java.time.LocalDate;

public class ReportSummaryDTO {

    private ReportPeriodDTO period;
    private ActiveLoansSummaryDTO activeLoans;
    private OverdueClientsSummaryDTO overdueClients;
    private PopularToolsSummaryDTO popularTools;
    private AlertsDTO alerts;

    // Constructors
    public ReportSummaryDTO() {}

    public ReportSummaryDTO(ReportPeriodDTO period, ActiveLoansSummaryDTO activeLoans,
                          OverdueClientsSummaryDTO overdueClients, PopularToolsSummaryDTO popularTools,
                          AlertsDTO alerts) {
        this.period = period;
        this.activeLoans = activeLoans;
        this.overdueClients = overdueClients;
        this.popularTools = popularTools;
        this.alerts = alerts;
    }

    // Getters and Setters
    public ReportPeriodDTO getPeriod() { return period; }
    public void setPeriod(ReportPeriodDTO period) { this.period = period; }

    public ActiveLoansSummaryDTO getActiveLoans() { return activeLoans; }
    public void setActiveLoans(ActiveLoansSummaryDTO activeLoans) { this.activeLoans = activeLoans; }

    public OverdueClientsSummaryDTO getOverdueClients() { return overdueClients; }
    public void setOverdueClients(OverdueClientsSummaryDTO overdueClients) { this.overdueClients = overdueClients; }

    public PopularToolsSummaryDTO getPopularTools() { return popularTools; }
    public void setPopularTools(PopularToolsSummaryDTO popularTools) { this.popularTools = popularTools; }

    public AlertsDTO getAlerts() { return alerts; }
    public void setAlerts(AlertsDTO alerts) { this.alerts = alerts; }

    // Inner Classes
    public static class ReportPeriodDTO {
        private LocalDate startDate;
        private LocalDate endDate;
        private boolean isCustomRange;

        // Constructors
        public ReportPeriodDTO() {}

        public ReportPeriodDTO(LocalDate startDate, LocalDate endDate, boolean isCustomRange) {
            this.startDate = startDate;
            this.endDate = endDate;
            this.isCustomRange = isCustomRange;
        }

        // Getters and Setters
        public LocalDate getStartDate() { return startDate; }
        public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

        public LocalDate getEndDate() { return endDate; }
        public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

        public boolean isCustomRange() { return isCustomRange; }
        public void setCustomRange(boolean customRange) { isCustomRange = customRange; }
    }

    public static class ActiveLoansSummaryDTO {
        private int total;
        private int active;
        private int overdue;

        // Constructors
        public ActiveLoansSummaryDTO() {}

        public ActiveLoansSummaryDTO(int total, int active, int overdue) {
            this.total = total;
            this.active = active;
            this.overdue = overdue;
        }

        // Getters and Setters
        public int getTotal() { return total; }
        public void setTotal(int total) { this.total = total; }

        public int getActive() { return active; }
        public void setActive(int active) { this.active = active; }

        public int getOverdue() { return overdue; }
        public void setOverdue(int overdue) { this.overdue = overdue; }
    }

    public static class OverdueClientsSummaryDTO {
        private int totalClients;
        private double totalOverdueAmount;

        // Constructors
        public OverdueClientsSummaryDTO() {}

        public OverdueClientsSummaryDTO(int totalClients, double totalOverdueAmount) {
            this.totalClients = totalClients;
            this.totalOverdueAmount = totalOverdueAmount;
        }

        // Getters and Setters
        public int getTotalClients() { return totalClients; }
        public void setTotalClients(int totalClients) { this.totalClients = totalClients; }

        public double getTotalOverdueAmount() { return totalOverdueAmount; }
        public void setTotalOverdueAmount(double totalOverdueAmount) { this.totalOverdueAmount = totalOverdueAmount; }
    }

    public static class PopularToolsSummaryDTO {
        private MostPopularToolDTO mostPopularTool;

        // Constructors
        public PopularToolsSummaryDTO() {}

        public PopularToolsSummaryDTO(MostPopularToolDTO mostPopularTool) {
            this.mostPopularTool = mostPopularTool;
        }

        // Getters and Setters
        public MostPopularToolDTO getMostPopularTool() { return mostPopularTool; }
        public void setMostPopularTool(MostPopularToolDTO mostPopularTool) { this.mostPopularTool = mostPopularTool; }
    }

    public static class MostPopularToolDTO {
        private String name;
        private int totalLoans;

        // Constructors
        public MostPopularToolDTO() {}

        public MostPopularToolDTO(String name, int totalLoans) {
            this.name = name;
            this.totalLoans = totalLoans;
        }

        // Getters and Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public int getTotalLoans() { return totalLoans; }
        public void setTotalLoans(int totalLoans) { this.totalLoans = totalLoans; }
    }

    public static class AlertsDTO {
        private int criticalOverdue;
        private int highDemandTools;
        private int riskyClients;

        // Constructors
        public AlertsDTO() {}

        public AlertsDTO(int criticalOverdue, int highDemandTools, int riskyClients) {
            this.criticalOverdue = criticalOverdue;
            this.highDemandTools = highDemandTools;
            this.riskyClients = riskyClients;
        }

        // Getters and Setters
        public int getCriticalOverdue() { return criticalOverdue; }
        public void setCriticalOverdue(int criticalOverdue) { this.criticalOverdue = criticalOverdue; }

        public int getHighDemandTools() { return highDemandTools; }
        public void setHighDemandTools(int highDemandTools) { this.highDemandTools = highDemandTools; }

        public int getRiskyClients() { return riskyClients; }
        public void setRiskyClients(int riskyClients) { this.riskyClients = riskyClients; }
    }
}
