package com.delta.account.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.delta.account.mapper.LoginLogMapper;
import com.delta.account.model.entity.LoginLog;
import com.delta.account.model.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class SecurityService {

    private final LoginLogMapper loginLogMapper;

    // 可配置的IP黑名单
    @Value("${security.ip-blacklist:}")
    private String ipBlacklist;

    // 可配置的IP白名单
    @Value("${security.ip-whitelist:}")
    private String ipWhitelist;

    /**
     * 检查IP是否允许访问
     */
    public boolean isIpAllowed(String ip) {
        // 白名单优先
        if (ipWhitelist != null && !ipWhitelist.isEmpty()) {
            String[] whitelist = ipWhitelist.split(",");
            for (String allowedIp : whitelist) {
                if (allowedIp.trim().equals(ip)) {
                    return true;
                }
            }
            return false;
        }

        // 黑名单检查
        if (ipBlacklist != null && !ipBlacklist.isEmpty()) {
            String[] blacklist = ipBlacklist.split(",");
            for (String blockedIp : blacklist) {
                if (blockedIp.trim().equals(ip)) {
                    log.warn("IP {} 在黑名单中", ip);
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * 记录登录日志
     */
    public void logLogin(User user, HttpServletRequest request, String action, String status, String reason) {
        try {
            LoginLog loginLog = new LoginLog();
            if (user != null) {
                loginLog.setUserId(user.getId());
                loginLog.setUsername(user.getUsername());
            }
            loginLog.setIp(getClientIp(request));
            loginLog.setUserAgent(request.getHeader("User-Agent"));
            loginLog.setAction(action);
            loginLog.setStatus(status);
            loginLog.setReason(reason);
            loginLogMapper.insert(loginLog);
        } catch (Exception e) {
            log.error("记录登录日志失败: {}", e.getMessage());
        }
    }

    /**
     * 获取用户最近登录记录
     */
    public List<LoginLog> getUserRecentLogs(Long userId, int limit) {
        QueryWrapper<LoginLog> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("user_id", userId);
        queryWrapper.orderByDesc("created_at");
        queryWrapper.last("LIMIT " + limit);
        return loginLogMapper.selectList(queryWrapper);
    }

    /**
     * 获取最近的登录失败记录
     */
    public int getFailedLoginCount(String username, int minutes) {
        QueryWrapper<LoginLog> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("username", username);
        queryWrapper.eq("status", "FAILED");
        queryWrapper.ge("created_at", LocalDateTime.now().minusMinutes(minutes));
        Long count = loginLogMapper.selectCount(queryWrapper);
        return count != null ? count.intValue() : 0;
    }

    /**
     * 获取客户端真实IP
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // 多个代理时取第一个
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    /**
     * 简单的SQL注入检查
     */
    public boolean containsSqlInjection(String input) {
        if (input == null) return false;
        String lowerInput = input.toLowerCase();
        return lowerInput.contains("union select") ||
               lowerInput.contains("drop table") ||
               lowerInput.contains("delete from") ||
               lowerInput.contains("insert into") ||
               lowerInput.contains("update ") ||
               lowerInput.contains("exec(") ||
               lowerInput.contains("execute(");
    }
}
