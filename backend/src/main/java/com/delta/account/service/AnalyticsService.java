package com.delta.account.service;

import com.delta.account.model.dto.DashboardStats;
import java.util.List;
import java.util.Map;

public interface AnalyticsService {
    
    /**
     * 获取管理后台统计数据
     */
    DashboardStats getDashboardStats();
    
    /**
     * 获取近7天趋势数据
     */
    Map<String, List<DashboardStats.DailyStats>> getTrendData(int days);
    
    /**
     * 获取热门账号
     */
    List<DashboardStats.AccountStats> getTopAccounts(int limit);
    
    /**
     * 获取分类统计
     */
    List<DashboardStats.CategoryStats> getCategoryStats();
    
    /**
     * 获取用户行为统计
     */
    Map<String, Object> getUserBehaviorStats(Long userId);
    
    /**
     * 记录账号浏览
     */
    void recordAccountView(Long accountId, Long userId);
    
    /**
     * 获取账号浏览量
     */
    long getAccountViewCount(Long accountId);
}