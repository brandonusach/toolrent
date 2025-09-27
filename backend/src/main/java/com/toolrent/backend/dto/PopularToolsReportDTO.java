package com.toolrent.backend.dto;

import java.time.LocalDate;
import java.util.List;

public class PopularToolsReportDTO {

    private List<PopularToolDTO> tools;
    private PopularToolsSummaryDTO summary;
    private ReportPeriodDTO period;

    // Constructors
    public PopularToolsReportDTO() {}

    public PopularToolsReportDTO(List<PopularToolDTO> tools, PopularToolsSummaryDTO summary, ReportPeriodDTO period) {
        this.tools = tools;
        this.summary = summary;
        this.period = period;
    }

    // Getters and Setters
    public List<PopularToolDTO> getTools() { return tools; }
    public void setTools(List<PopularToolDTO> tools) { this.tools = tools; }

    public PopularToolsSummaryDTO getSummary() { return summary; }
    public void setSummary(PopularToolsSummaryDTO summary) { this.summary = summary; }

    public ReportPeriodDTO getPeriod() { return period; }
    public void setPeriod(ReportPeriodDTO period) { this.period = period; }

    // Inner Classes
    public static class PopularToolDTO {
        private Long id;
        private String name;
        private String categoryName;
        private int totalLoans;
        private int totalQuantity;
        private int uniqueClients;
        private double avgLoanDuration;
        private double popularityScore;

        // Constructors
        public PopularToolDTO() {}

        public PopularToolDTO(Long id, String name, String categoryName, int totalLoans,
                            int totalQuantity, int uniqueClients, double avgLoanDuration, double popularityScore) {
            this.id = id;
            this.name = name;
            this.categoryName = categoryName;
            this.totalLoans = totalLoans;
            this.totalQuantity = totalQuantity;
            this.uniqueClients = uniqueClients;
            this.avgLoanDuration = avgLoanDuration;
            this.popularityScore = popularityScore;
        }

        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getCategoryName() { return categoryName; }
        public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

        public int getTotalLoans() { return totalLoans; }
        public void setTotalLoans(int totalLoans) { this.totalLoans = totalLoans; }

        public int getTotalQuantity() { return totalQuantity; }
        public void setTotalQuantity(int totalQuantity) { this.totalQuantity = totalQuantity; }

        public int getUniqueClients() { return uniqueClients; }
        public void setUniqueClients(int uniqueClients) { this.uniqueClients = uniqueClients; }

        public double getAvgLoanDuration() { return avgLoanDuration; }
        public void setAvgLoanDuration(double avgLoanDuration) { this.avgLoanDuration = avgLoanDuration; }

        public double getPopularityScore() { return popularityScore; }
        public void setPopularityScore(double popularityScore) { this.popularityScore = popularityScore; }
    }

    public static class PopularToolsSummaryDTO {
        private int totalToolsAnalyzed;
        private int totalLoansAnalyzed;
        private MostPopularToolDTO mostPopularTool;
        private double avgLoansPerTool;

        // Constructors
        public PopularToolsSummaryDTO() {}

        public PopularToolsSummaryDTO(int totalToolsAnalyzed, int totalLoansAnalyzed,
                                    MostPopularToolDTO mostPopularTool, double avgLoansPerTool) {
            this.totalToolsAnalyzed = totalToolsAnalyzed;
            this.totalLoansAnalyzed = totalLoansAnalyzed;
            this.mostPopularTool = mostPopularTool;
            this.avgLoansPerTool = avgLoansPerTool;
        }

        // Getters and Setters
        public int getTotalToolsAnalyzed() { return totalToolsAnalyzed; }
        public void setTotalToolsAnalyzed(int totalToolsAnalyzed) { this.totalToolsAnalyzed = totalToolsAnalyzed; }

        public int getTotalLoansAnalyzed() { return totalLoansAnalyzed; }
        public void setTotalLoansAnalyzed(int totalLoansAnalyzed) { this.totalLoansAnalyzed = totalLoansAnalyzed; }

        public MostPopularToolDTO getMostPopularTool() { return mostPopularTool; }
        public void setMostPopularTool(MostPopularToolDTO mostPopularTool) { this.mostPopularTool = mostPopularTool; }

        public double getAvgLoansPerTool() { return avgLoansPerTool; }
        public void setAvgLoansPerTool(double avgLoansPerTool) { this.avgLoansPerTool = avgLoansPerTool; }
    }

    public static class MostPopularToolDTO {
        private Long id;
        private String name;
        private int totalLoans;

        // Constructors
        public MostPopularToolDTO() {}

        public MostPopularToolDTO(Long id, String name, int totalLoans) {
            this.id = id;
            this.name = name;
            this.totalLoans = totalLoans;
        }

        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public int getTotalLoans() { return totalLoans; }
        public void setTotalLoans(int totalLoans) { this.totalLoans = totalLoans; }
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
