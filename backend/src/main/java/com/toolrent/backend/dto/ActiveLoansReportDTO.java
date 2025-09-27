package com.toolrent.backend.dto;

import java.time.LocalDate;
import java.util.List;

public class ActiveLoansReportDTO {

    private List<ActiveLoanDTO> loans;
    private ActiveLoansSummaryDTO summary;
    private ReportPeriodDTO period;

    // Constructors
    public ActiveLoansReportDTO() {}

    public ActiveLoansReportDTO(List<ActiveLoanDTO> loans, ActiveLoansSummaryDTO summary, ReportPeriodDTO period) {
        this.loans = loans;
        this.summary = summary;
        this.period = period;
    }

    // Getters and Setters
    public List<ActiveLoanDTO> getLoans() { return loans; }
    public void setLoans(List<ActiveLoanDTO> loans) { this.loans = loans; }

    public ActiveLoansSummaryDTO getSummary() { return summary; }
    public void setSummary(ActiveLoansSummaryDTO summary) { this.summary = summary; }

    public ReportPeriodDTO getPeriod() { return period; }
    public void setPeriod(ReportPeriodDTO period) { this.period = period; }

    // Inner Classes
    public static class ActiveLoanDTO {
        private Long id;
        private String clientName;
        private String toolName;
        private String categoryName;
        private Integer quantity;
        private LocalDate loanDate;
        private LocalDate agreedReturnDate;
        private String status; // ACTIVE, OVERDUE
        private boolean isOverdue;
        private int daysOverdue;
        private String notes;

        // Constructors
        public ActiveLoanDTO() {}

        public ActiveLoanDTO(Long id, String clientName, String toolName, String categoryName,
                           Integer quantity, LocalDate loanDate, LocalDate agreedReturnDate,
                           String status, boolean isOverdue, int daysOverdue, String notes) {
            this.id = id;
            this.clientName = clientName;
            this.toolName = toolName;
            this.categoryName = categoryName;
            this.quantity = quantity;
            this.loanDate = loanDate;
            this.agreedReturnDate = agreedReturnDate;
            this.status = status;
            this.isOverdue = isOverdue;
            this.daysOverdue = daysOverdue;
            this.notes = notes;
        }

        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getClientName() { return clientName; }
        public void setClientName(String clientName) { this.clientName = clientName; }

        public String getToolName() { return toolName; }
        public void setToolName(String toolName) { this.toolName = toolName; }

        public String getCategoryName() { return categoryName; }
        public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }

        public LocalDate getLoanDate() { return loanDate; }
        public void setLoanDate(LocalDate loanDate) { this.loanDate = loanDate; }

        public LocalDate getAgreedReturnDate() { return agreedReturnDate; }
        public void setAgreedReturnDate(LocalDate agreedReturnDate) { this.agreedReturnDate = agreedReturnDate; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public boolean isOverdue() { return isOverdue; }
        public void setOverdue(boolean overdue) { isOverdue = overdue; }

        public int getDaysOverdue() { return daysOverdue; }
        public void setDaysOverdue(int daysOverdue) { this.daysOverdue = daysOverdue; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class ActiveLoansSummaryDTO {
        private int total;
        private int active;
        private int overdue;
        private double avgDaysOverdue;

        // Constructors
        public ActiveLoansSummaryDTO() {}

        public ActiveLoansSummaryDTO(int total, int active, int overdue, double avgDaysOverdue) {
            this.total = total;
            this.active = active;
            this.overdue = overdue;
            this.avgDaysOverdue = avgDaysOverdue;
        }

        // Getters and Setters
        public int getTotal() { return total; }
        public void setTotal(int total) { this.total = total; }

        public int getActive() { return active; }
        public void setActive(int active) { this.active = active; }

        public int getOverdue() { return overdue; }
        public void setOverdue(int overdue) { this.overdue = overdue; }

        public double getAvgDaysOverdue() { return avgDaysOverdue; }
        public void setAvgDaysOverdue(double avgDaysOverdue) { this.avgDaysOverdue = avgDaysOverdue; }
    }

    public static class ReportPeriodDTO {
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer totalDays;

        // Constructors
        public ReportPeriodDTO() {}

        public ReportPeriodDTO(LocalDate startDate, LocalDate endDate, Integer totalDays) {
            this.startDate = startDate;
            this.endDate = endDate;
            this.totalDays = totalDays;
        }

        // Getters and Setters
        public LocalDate getStartDate() { return startDate; }
        public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

        public LocalDate getEndDate() { return endDate; }
        public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

        public Integer getTotalDays() { return totalDays; }
        public void setTotalDays(Integer totalDays) { this.totalDays = totalDays; }
    }
}
