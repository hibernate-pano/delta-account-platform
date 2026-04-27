package com.delta.account.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.delta.account.mapper.*;
import com.delta.account.model.dto.DashboardStats;
import com.delta.account.model.entity.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {
    
    private final UserMapper userMapper;
    private final AccountMapper accountMapper;
    private final OrderMapper orderMapper;
    private final DisputeMapper disputeMapper;
    
    @Override
    public DashboardStats getDashboardStats() {
        DashboardStats stats = new DashboardStats();
        
        // User stats
        stats.setTotalUsers(userMapper.selectCount(null));
        stats.setTodayUsers(userMapper.selectCount(
                new LambdaQueryWrapper<User>()
                        .ge(User::getCreatedAt, LocalDateTime.now().with(LocalTime.MIN))
        ));
        
        // Account stats
        stats.setTotalAccounts(accountMapper.selectCount(null));
        stats.setAccountsOnSale(accountMapper.selectCount(
                new LambdaQueryWrapper<Account>().eq(Account::getStatus, "ON_SALE")
        ));
        stats.setAccountsSold(accountMapper.selectCount(
                new LambdaQueryWrapper<Account>().eq(Account::getStatus, "SOLD")
        ));
        stats.setAccountsRented(accountMapper.selectCount(
                new LambdaQueryWrapper<Account>().eq(Account::getStatus, "RENTED")
        ));
        stats.setPendingAccounts(accountMapper.selectCount(
                new LambdaQueryWrapper<Account>().eq(Account::getStatus, "PENDING")
        ));
        
        // Order stats
        stats.setTotalOrders(orderMapper.selectCount(null));
        stats.setTodayOrders(orderMapper.selectCount(
                new LambdaQueryWrapper<Order>()
                        .ge(Order::getCreatedAt, LocalDateTime.now().with(LocalTime.MIN))
        ));
        stats.setPendingOrders(orderMapper.selectCount(
                new LambdaQueryWrapper<Order>().eq(Order::getStatus, "PENDING")
        ));
        stats.setCompletedOrders(orderMapper.selectCount(
                new LambdaQueryWrapper<Order>().eq(Order::getStatus, "COMPLETED")
        ));
        stats.setCancelledOrders(orderMapper.selectCount(
                new LambdaQueryWrapper<Order>().eq(Order::getStatus, "CANCELLED")
        ));
        
        // Dispute stats
        stats.setPendingDisputes(disputeMapper.selectCount(
                new LambdaQueryWrapper<Dispute>()
                        .in(Dispute::getStatus, "OPEN", "UNDER_REVIEW", "MEDIATING")
        ));
        
        // Revenue stats - simplified placeholder
        stats.setTotalRevenue(BigDecimal.ZERO);
        stats.setRevenueToday(BigDecimal.ZERO);
        stats.setRevenueThisWeek(BigDecimal.ZERO);
        stats.setAverageOrderValue(BigDecimal.ZERO);
        
        // Rating stats - simplified
        stats.setAverageRating(0.0);
        stats.setTotalReviews(0L);
        
        // Orders by status
        Map<String, Long> ordersByStatus = new HashMap<>();
        ordersByStatus.put("PENDING", stats.getPendingOrders());
        ordersByStatus.put("PAID", orderMapper.selectCount(new LambdaQueryWrapper<Order>().eq(Order::getStatus, "PAID")));
        ordersByStatus.put("COMPLETED", stats.getCompletedOrders());
        ordersByStatus.put("CANCELLED", stats.getCancelledOrders());
        stats.setOrdersByStatus(ordersByStatus);
        
        // Orders by type
        Map<String, Long> ordersByType = new HashMap<>();
        ordersByType.put("BUY", orderMapper.selectCount(new LambdaQueryWrapper<Order>().eq(Order::getType, "BUY")));
        ordersByType.put("RENT", orderMapper.selectCount(new LambdaQueryWrapper<Order>().eq(Order::getType, "RENT")));
        stats.setOrdersByType(ordersByType);
        
        // Top accounts
        stats.setTopAccounts(getTopAccounts(5));
        
        // Trends
        stats.setTrends(getTrendData(7));
        
        return stats;
    }
    
    @Override
    public Map<String, List<DashboardStats.DailyStats>> getTrendData(int days) {
        Map<String, List<DashboardStats.DailyStats>> trends = new HashMap<>();
        
        // Order trend
        List<DashboardStats.DailyStats> orderTrend = new ArrayList<>();
        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            LocalDateTime dayStart = date.atStartOfDay();
            LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();
            
            long count = orderMapper.selectCount(
                    new LambdaQueryWrapper<Order>()
                            .ge(Order::getCreatedAt, dayStart)
                            .lt(Order::getCreatedAt, dayEnd)
            );
            
            DashboardStats.DailyStats ds = new DashboardStats.DailyStats();
            ds.setDate(dayStart);
            ds.setCount(count);
            ds.setAmount(BigDecimal.ZERO);
            orderTrend.add(ds);
        }
        trends.put("orders", orderTrend);
        
        // User trend
        List<DashboardStats.DailyStats> userTrend = new ArrayList<>();
        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            LocalDateTime dayStart = date.atStartOfDay();
            LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();
            
            long count = userMapper.selectCount(
                    new LambdaQueryWrapper<User>()
                            .ge(User::getCreatedAt, dayStart)
                            .lt(User::getCreatedAt, dayEnd)
            );
            
            DashboardStats.DailyStats ds = new DashboardStats.DailyStats();
            ds.setDate(dayStart);
            ds.setCount(count);
            ds.setAmount(BigDecimal.ZERO);
            userTrend.add(ds);
        }
        trends.put("users", userTrend);
        
        return trends;
    }
    
    @Override
    public List<DashboardStats.AccountStats> getTopAccounts(int limit) {
        List<Account> accounts = accountMapper.selectList(
                new LambdaQueryWrapper<Account>()
                        .eq(Account::getStatus, "ON_SALE")
                        .orderByDesc(Account::getCreatedAt)
                        .last("LIMIT " + limit)
        );
        
        return accounts.stream().map(account -> {
            DashboardStats.AccountStats as = new DashboardStats.AccountStats();
            as.setId(account.getId());
            as.setTitle(account.getTitle());
            as.setViewCount(0);
            as.setOrderCount(orderMapper.selectCount(
                    new LambdaQueryWrapper<Order>()
                            .eq(Order::getAccountId, account.getId())
            ));
            as.setTotalAmount(BigDecimal.ZERO);
            return as;
        }).collect(Collectors.toList());
    }
    
    @Override
    public List<DashboardStats.CategoryStats> getCategoryStats() {
        // Implementation for category stats
        return new ArrayList<>();
    }
    
    @Override
    public Map<String, Object> getUserBehaviorStats(Long userId) {
        Map<String, Object> stats = new HashMap<>();
        
        long orderCount = orderMapper.selectCount(
                new LambdaQueryWrapper<Order>()
                        .eq(Order::getBuyerId, userId)
                        .or()
                        .eq(Order::getSellerId, userId)
        );
        stats.put("orderCount", orderCount);
        
        long completedCount = orderMapper.selectCount(
                new LambdaQueryWrapper<Order>()
                        .eq(Order::getBuyerId, userId)
                        .or()
                        .eq(Order::getSellerId, userId)
                        .eq(Order::getStatus, "COMPLETED")
        );
        stats.put("completedCount", completedCount);
        
        long disputeCount = disputeMapper.selectCount(
                new LambdaQueryWrapper<Dispute>()
                        .eq(Dispute::getInitiatorId, userId)
                        .or()
                        .eq(Dispute::getRespondentId, userId)
        );
        stats.put("disputeCount", disputeCount);
        
        long accountCount = accountMapper.selectCount(
                new LambdaQueryWrapper<Account>()
                        .eq(Account::getSellerId, userId)
        );
        stats.put("accountCount", accountCount);
        
        return stats;
    }
    
    @Override
    public void recordAccountView(Long accountId, Long userId) {
        log.info("Account view: accountId={}, userId={}", accountId, userId);
    }
    
    @Override
    public long getAccountViewCount(Long accountId) {
        return 0;
    }
}