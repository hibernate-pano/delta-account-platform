package com.delta.account.service;

import com.delta.account.model.entity.AuditLog;
import com.delta.account.model.entity.User;
import com.baomidou.mybatisplus.core.metadata.IPage;

public interface AuditService {
    
    /**
     * 记录操作日志
     */
    void log(User user, String action, String entityType, Long entityId, String description);
    
    /**
     * 记录操作日志（带请求参数）
     */
    void logWithParams(User user, String action, String entityType, Long entityId, 
                       String description, Object requestParams);
    
    /**
     * 获取用户的操作历史
     */
    IPage<AuditLog> getUserAuditLogs(Long userId, int page, int size);
}