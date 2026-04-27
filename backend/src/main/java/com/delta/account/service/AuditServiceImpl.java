package com.delta.account.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.delta.account.mapper.AuditLogMapper;
import com.delta.account.model.entity.AuditLog;
import com.delta.account.model.entity.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {
    
    private final AuditLogMapper auditLogMapper;
    private final ObjectMapper objectMapper;
    
    @Override
    @Async
    public void log(User user, String action, String entityType, Long entityId, String description) {
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setUserId(user != null ? user.getId() : null);
            auditLog.setAction(action);
            auditLog.setEntityType(entityType);
            auditLog.setEntityId(entityId);
            auditLog.setDescription(description);
            
            // 尝试获取请求信息
            HttpServletRequest request = getCurrentRequest();
            if (request != null) {
                auditLog.setIpAddress(getClientIP(request));
                auditLog.setUserAgent(request.getHeader("User-Agent"));
            }
            
            auditLogMapper.insert(auditLog);
        } catch (Exception e) {
            log.error("Failed to write audit log: action={}, entityType={}, entityId={}", 
                    action, entityType, entityId, e);
        }
    }
    
    @Override
    @Async
    public void logWithParams(User user, String action, String entityType, Long entityId,
                              String description, Object requestParams) {
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setUserId(user != null ? user.getId() : null);
            auditLog.setAction(action);
            auditLog.setEntityType(entityType);
            auditLog.setEntityId(entityId);
            auditLog.setDescription(description);
            
            // 尝试获取请求信息
            HttpServletRequest request = getCurrentRequest();
            if (request != null) {
                auditLog.setIpAddress(getClientIP(request));
                auditLog.setUserAgent(request.getHeader("User-Agent"));
                auditLog.setRequestParams(objectMapper.writeValueAsString(request.getParameterMap()));
            }
            
            // 存储请求体参数
            if (requestParams != null) {
                try {
                    auditLog.setRequestParams(objectMapper.writeValueAsString(requestParams));
                } catch (Exception e) {
                    log.warn("Failed to serialize request params", e);
                }
            }
            
            auditLogMapper.insert(auditLog);
        } catch (Exception e) {
            log.error("Failed to write audit log with params: action={}, entityType={}, entityId={}", 
                    action, entityType, entityId, e);
        }
    }
    
    @Override
    public IPage<AuditLog> getUserAuditLogs(Long userId, int page, int size) {
        LambdaQueryWrapper<AuditLog> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AuditLog::getUserId, userId)
               .orderByDesc(AuditLog::getCreatedAt);
        return auditLogMapper.selectPage(new Page<>(page, size), wrapper);
    }
    
    private HttpServletRequest getCurrentRequest() {
        try {
            ServletRequestAttributes attributes = 
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attributes != null ? attributes.getRequest() : null;
        } catch (Exception e) {
            return null;
        }
    }
    
    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIP = request.getHeader("X-Real-IP");
        if (xRealIP != null && !xRealIP.isEmpty()) {
            return xRealIP;
        }
        return request.getRemoteAddr();
    }
}