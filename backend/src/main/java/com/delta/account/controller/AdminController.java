package com.delta.account.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.delta.account.common.Result;
import com.delta.account.mapper.AccountMapper;
import com.delta.account.mapper.OrderMapper;
import com.delta.account.mapper.ReviewMapper;
import com.delta.account.mapper.UserMapper;
import com.delta.account.model.dto.DashboardStats;
import com.delta.account.model.entity.Account;
import com.delta.account.model.entity.Order;
import com.delta.account.model.entity.User;
import com.delta.account.service.AccountService;
import com.delta.account.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "管理接口")
@RequiredArgsConstructor
public class AdminController {

    private final UserMapper userMapper;
    private final OrderMapper orderMapper;
    private final AccountMapper accountMapper;
    private final ReviewMapper reviewMapper;
    private final AccountService accountService;
    private final NotificationService notificationService;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "获取统计数据")
    public Result<DashboardStats> getStats() {
        DashboardStats stats = new DashboardStats();

        // User stats
        stats.setTotalUsers(userMapper.selectCount(null));

        // Account stats
        QueryWrapper<Account> accountOnSale = new QueryWrapper<Account>().eq("status", "ON_SALE");
        stats.setAccountsOnSale(accountMapper.selectCount(accountOnSale));

        QueryWrapper<Account> accountSold = new QueryWrapper<Account>().eq("status", "SOLD");
        stats.setAccountsSold(accountMapper.selectCount(accountSold));

        QueryWrapper<Account> accountRented = new QueryWrapper<Account>().eq("status", "RENTED");
        stats.setAccountsRented(accountMapper.selectCount(accountRented));

        stats.setTotalAccounts(stats.getAccountsOnSale() + stats.getAccountsSold() + stats.getAccountsRented());

        // Order stats
        stats.setTotalOrders(orderMapper.selectCount(null));

        QueryWrapper<Order> pendingQuery = new QueryWrapper<Order>().eq("status", "PENDING");
        stats.setPendingOrders(orderMapper.selectCount(pendingQuery));

        QueryWrapper<Order> completedQuery = new QueryWrapper<Order>().eq("status", "COMPLETED");
        stats.setCompletedOrders(orderMapper.selectCount(completedQuery));

        QueryWrapper<Order> cancelledQuery = new QueryWrapper<Order>().eq("status", "CANCELLED");
        stats.setCancelledOrders(orderMapper.selectCount(cancelledQuery));

        // Revenue - sum of completed orders
        // This is a simplified calculation - in production you'd have a payment table
        stats.setTotalRevenue(BigDecimal.ZERO);
        stats.setRevenueToday(BigDecimal.ZERO);
        stats.setRevenueThisWeek(BigDecimal.ZERO);
        stats.setAverageOrderValue(BigDecimal.ZERO);

        // Rating stats
        Double avgRating = reviewMapper.selectAvgRating();
        stats.setAverageRating(avgRating != null ? avgRating : 0.0);
        stats.setTotalReviews(reviewMapper.selectCount(null));

        // Orders by status
        Map<String, Long> ordersByStatus = new HashMap<>();
        ordersByStatus.put("PENDING", stats.getPendingOrders());
        ordersByStatus.put("PAID", orderMapper.selectCount(new QueryWrapper<Order>().eq("status", "PAID")));
        ordersByStatus.put("COMPLETED", stats.getCompletedOrders());
        ordersByStatus.put("CANCELLED", stats.getCancelledOrders());
        stats.setOrdersByStatus(ordersByStatus);

        // Orders by type
        Map<String, Long> ordersByType = new HashMap<>();
        ordersByType.put("BUY", orderMapper.selectCount(new QueryWrapper<Order>().eq("type", "BUY")));
        ordersByType.put("RENT", orderMapper.selectCount(new QueryWrapper<Order>().eq("type", "RENT")));
        stats.setOrdersByType(ordersByType);

        return Result.success(stats);
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "获取用户列表")
    public Result<Page<User>> getUsers(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        size = Math.min(size, 100);
        Page<User> userPage = new Page<>(page, size);
        return Result.success(userMapper.selectPage(userPage, null));
    }

    @PutMapping("/users/{id}/ban")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "封禁用户")
    public Result<Void> banUser(@PathVariable Long id, @AuthenticationPrincipal User admin) {
        if (id.equals(admin.getId())) {
            return Result.error(400, "不能封禁自己");
        }
        User user = userMapper.selectById(id);
        if (user == null) {
            return Result.error(404, "用户不存在");
        }
        if ("ADMIN".equals(user.getRole())) {
            return Result.error(400, "不能封禁管理员");
        }
        user.setStatus("BANNED");
        userMapper.updateById(user);
        return Result.success();
    }

    @PutMapping("/users/{id}/unban")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "解封用户")
    public Result<Void> unbanUser(@PathVariable Long id) {
        User user = userMapper.selectById(id);
        if (user == null) {
            return Result.error(404, "用户不存在");
        }
        user.setStatus("ACTIVE");
        userMapper.updateById(user);
        return Result.success();
    }

    @GetMapping("/accounts/pending")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "获取待审核账号")
    public Result<Page<Account>> getPendingAccounts(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        size = Math.min(size, 100);
        return Result.success(accountService.getPendingAccounts(page, size));
    }

    @PutMapping("/accounts/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "审核账号")
    public Result<Void> verifyAccount(
            @PathVariable Long id,
            @RequestParam String action) {
        if (!"approve".equals(action) && !"reject".equals(action)) {
            return Result.error(400, "操作只能为approve或reject");
        }
        accountService.verifyAccount(id, action);
        return Result.success();
    }

    @GetMapping("/orders")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "获取全部订单")
    public Result<Page<Order>> getAllOrders(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String status) {
        size = Math.min(size, 100);
        Page<Order> pageParam = new Page<>(page, size);
        QueryWrapper<Order> queryWrapper = new QueryWrapper<>();
        if (status != null && !status.isEmpty()) {
            queryWrapper.eq("status", status);
        }
        queryWrapper.orderByDesc("created_at");
        return Result.success(orderMapper.selectPage(pageParam, queryWrapper));
    }
}
