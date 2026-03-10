package com.delta.account.model.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.Map;

@Data
public class DashboardStats {
    // User stats
    private long totalUsers;
    private long activeUsers;
    private long newUsersToday;
    private long newUsersThisWeek;

    // Account stats
    private long totalAccounts;
    private long accountsOnSale;
    private long accountsSold;
    private long accountsRented;

    // Order stats
    private long totalOrders;
    private long ordersToday;
    private long ordersThisWeek;
    private long pendingOrders;
    private long completedOrders;
    private long cancelledOrders;

    // Revenue stats
    private BigDecimal totalRevenue;
    private BigDecimal revenueToday;
    private BigDecimal revenueThisWeek;
    private BigDecimal averageOrderValue;

    // Rating stats
    private double averageRating;
    private long totalReviews;

    // Additional metrics
    private Map<String, Long> ordersByStatus;
    private Map<String, Long> ordersByType;
    private Map<String, Long> accountsByRank;
}
