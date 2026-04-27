package com.delta.account.controller;

import com.delta.account.common.Result;
import com.delta.account.model.dto.DashboardStats;
import com.delta.account.model.entity.User;
import com.delta.account.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "数据统计")
public class AnalyticsController {
    
    private final AnalyticsService analyticsService;
    
    @GetMapping("/dashboard")
    @Operation(summary = "获取管理后台统计数据")
    public Result<DashboardStats> getDashboardStats(@AuthenticationPrincipal User user) {
        // 只有管理员可以访问
        if (!"ADMIN".equals(user.getRole())) {
            return Result.error("无权限访问");
        }
        return Result.success(analyticsService.getDashboardStats());
    }
    
    @GetMapping("/trends")
    @Operation(summary = "获取趋势数据")
    public Result<Map<String, List<DashboardStats.DailyStats>>> getTrendData(
            @RequestParam(defaultValue = "7") int days) {
        return Result.success(analyticsService.getTrendData(days));
    }
    
    @GetMapping("/top-accounts")
    @Operation(summary = "获取热门账号")
    public Result<List<DashboardStats.AccountStats>> getTopAccounts(
            @RequestParam(defaultValue = "10") int limit) {
        return Result.success(analyticsService.getTopAccounts(limit));
    }
    
    @GetMapping("/categories")
    @Operation(summary = "获取分类统计")
    public Result<List<DashboardStats.CategoryStats>> getCategoryStats() {
        return Result.success(analyticsService.getCategoryStats());
    }
    
    @GetMapping("/user/{userId}/behavior")
    @Operation(summary = "获取用户行为统计")
    public Result<Map<String, Object>> getUserBehaviorStats(@PathVariable Long userId) {
        return Result.success(analyticsService.getUserBehaviorStats(userId));
    }
    
    @PostMapping("/record-view")
    @Operation(summary = "记录账号浏览")
    public Result<Void> recordAccountView(
            @RequestParam Long accountId,
            @RequestParam(required = false) Long userId) {
        analyticsService.recordAccountView(accountId, userId);
        return Result.success((Void) null);
    }
}