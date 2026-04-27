package com.delta.account.model.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
public class DashboardStats {
    // User stats
    private Long totalUsers;
    private Long todayUsers;
    
    // Account stats
    private Long totalAccounts;
    private Long accountsOnSale;
    private Long accountsSold;
    private Long accountsRented;
    private Long pendingAccounts;
    
    // Order stats
    private Long totalOrders;
    private Long pendingOrders;
    private Long completedOrders;
    private Long cancelledOrders;
    private Long todayOrders;
    
    // Dispute stats
    private Long pendingDisputes;
    
    // Revenue stats
    private BigDecimal totalRevenue;
    private BigDecimal revenueToday;
    private BigDecimal revenueThisWeek;
    private BigDecimal averageOrderValue;
    
    // Rating stats
    private Double averageRating;
    private Long totalReviews;
    
    // Category breakdown
    private Map<String, Long> ordersByStatus;
    private Map<String, Long> ordersByType;
    
    // Trend data
    private Map<String, List<DailyStats>> trends;
    
    // Top accounts
    private List<AccountStats> topAccounts;
    
    // Recent orders (optional)
    private List<OrderStats> recentOrders;
    
    @Data
    public static class AccountStats {
        private Long id;
        private String title;
        private long viewCount;
        private long orderCount;
        private BigDecimal totalAmount;
    }
    
    @Data
    public static class OrderStats {
        private Long id;
        private String orderNo;
        private String type;
        private BigDecimal amount;
        private String status;
        private LocalDateTime createdAt;
    }
    
    @Data
    public static class DailyStats {
        private LocalDateTime date;
        private long count;
        private BigDecimal amount;
    }
    
    @Data
    public static class CategoryStats {
        private String category;
        private long count;
        private BigDecimal amount;
    }
}