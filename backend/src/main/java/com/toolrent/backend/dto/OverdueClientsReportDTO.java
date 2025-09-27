package com.toolrent.backend.dto;

import java.util.List;

public class OverdueClientsReportDTO {

    private List<OverdueClientDTO> clients;
    private OverdueClientsSummaryDTO summary;

    // Constructors
    public OverdueClientsReportDTO() {}

    public OverdueClientsReportDTO(List<OverdueClientDTO> clients, OverdueClientsSummaryDTO summary) {
        this.clients = clients;
        this.summary = summary;
    }

    // Getters and Setters
    public List<OverdueClientDTO> getClients() { return clients; }
    public void setClients(List<OverdueClientDTO> clients) { this.clients = clients; }

    public OverdueClientsSummaryDTO getSummary() { return summary; }
    public void setSummary(OverdueClientsSummaryDTO summary) { this.summary = summary; }

    // Inner Classes
    public static class OverdueClientDTO {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private int loansCount;
        private int maxDaysOverdue;
        private double avgDaysOverdue;
        private double totalOverdueAmount;
        private List<OverdueLoanDTO> overdueLoans;

        // Constructors
        public OverdueClientDTO() {}

        public OverdueClientDTO(Long id, String name, String email, String phone, int loansCount,
                              int maxDaysOverdue, double avgDaysOverdue, double totalOverdueAmount,
                              List<OverdueLoanDTO> overdueLoans) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.phone = phone;
            this.loansCount = loansCount;
            this.maxDaysOverdue = maxDaysOverdue;
            this.avgDaysOverdue = avgDaysOverdue;
            this.totalOverdueAmount = totalOverdueAmount;
            this.overdueLoans = overdueLoans;
        }

        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }

        public int getLoansCount() { return loansCount; }
        public void setLoansCount(int loansCount) { this.loansCount = loansCount; }

        public int getMaxDaysOverdue() { return maxDaysOverdue; }
        public void setMaxDaysOverdue(int maxDaysOverdue) { this.maxDaysOverdue = maxDaysOverdue; }

        public double getAvgDaysOverdue() { return avgDaysOverdue; }
        public void setAvgDaysOverdue(double avgDaysOverdue) { this.avgDaysOverdue = avgDaysOverdue; }

        public double getTotalOverdueAmount() { return totalOverdueAmount; }
        public void setTotalOverdueAmount(double totalOverdueAmount) { this.totalOverdueAmount = totalOverdueAmount; }

        public List<OverdueLoanDTO> getOverdueLoans() { return overdueLoans; }
        public void setOverdueLoans(List<OverdueLoanDTO> overdueLoans) { this.overdueLoans = overdueLoans; }
    }

    public static class OverdueLoanDTO {
        private Long id;
        private String toolName;
        private int daysOverdue;
        private double fineAmount;

        // Constructors
        public OverdueLoanDTO() {}

        public OverdueLoanDTO(Long id, String toolName, int daysOverdue, double fineAmount) {
            this.id = id;
            this.toolName = toolName;
            this.daysOverdue = daysOverdue;
            this.fineAmount = fineAmount;
        }

        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getToolName() { return toolName; }
        public void setToolName(String toolName) { this.toolName = toolName; }

        public int getDaysOverdue() { return daysOverdue; }
        public void setDaysOverdue(int daysOverdue) { this.daysOverdue = daysOverdue; }

        public double getFineAmount() { return fineAmount; }
        public void setFineAmount(double fineAmount) { this.fineAmount = fineAmount; }
    }

    public static class OverdueClientsSummaryDTO {
        private int totalClients;
        private int totalOverdueLoans;
        private double totalOverdueAmount;
        private double avgDaysOverdue;

        // Constructors
        public OverdueClientsSummaryDTO() {}

        public OverdueClientsSummaryDTO(int totalClients, int totalOverdueLoans,
                                      double totalOverdueAmount, double avgDaysOverdue) {
            this.totalClients = totalClients;
            this.totalOverdueLoans = totalOverdueLoans;
            this.totalOverdueAmount = totalOverdueAmount;
            this.avgDaysOverdue = avgDaysOverdue;
        }

        // Getters and Setters
        public int getTotalClients() { return totalClients; }
        public void setTotalClients(int totalClients) { this.totalClients = totalClients; }

        public int getTotalOverdueLoans() { return totalOverdueLoans; }
        public void setTotalOverdueLoans(int totalOverdueLoans) { this.totalOverdueLoans = totalOverdueLoans; }

        public double getTotalOverdueAmount() { return totalOverdueAmount; }
        public void setTotalOverdueAmount(double totalOverdueAmount) { this.totalOverdueAmount = totalOverdueAmount; }

        public double getAvgDaysOverdue() { return avgDaysOverdue; }
        public void setAvgDaysOverdue(double avgDaysOverdue) { this.avgDaysOverdue = avgDaysOverdue; }
    }
}
