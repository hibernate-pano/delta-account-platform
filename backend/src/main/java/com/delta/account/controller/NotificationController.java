package com.delta.account.controller;

import com.delta.account.common.Result;
import com.delta.account.mapper.NotificationMapper;
import com.delta.account.model.entity.Notification;
import com.delta.account.model.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "通知管理")
@RequiredArgsConstructor
public class NotificationController {
    
    private final NotificationMapper notificationMapper;
    
    @GetMapping
    @Operation(summary = "获取通知列表")
    public Result<List<Notification>> getNotifications(@AuthenticationPrincipal User user) {
        List<Notification> notifications = notificationMapper.selectList(
                new QueryWrapper<Notification>()
                        .eq("user_id", user.getId())
                        .orderByDesc("created_at")
                        .last("LIMIT 20")
        );
        return Result.success(notifications);
    }
    
    @GetMapping("/unread-count")
    @Operation(summary = "获取未读数量")
    public Result<Long> getUnreadCount(@AuthenticationPrincipal User user) {
        Long count = notificationMapper.selectCount(
                new QueryWrapper<Notification>()
                        .eq("user_id", user.getId())
                        .eq("status", "UNREAD")
        );
        return Result.success(count);
    }
    
    @PutMapping("/{id}/read")
    @Operation(summary = "标记已读")
    public Result<Void> markAsRead(@PathVariable Long id, @AuthenticationPrincipal User user) {
        Notification notification = notificationMapper.selectById(id);
        if (notification != null && notification.getUserId().equals(user.getId())) {
            notification.setStatus("READ");
            notificationMapper.updateById(notification);
        }
        return Result.success();
    }
    
    @PutMapping("/read-all")
    @Operation(summary = "全部标记已读")
    public Result<Void> markAllAsRead(@AuthenticationPrincipal User user) {
        notificationMapper.update(null, 
                new com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper<Notification>()
                        .eq("user_id", user.getId())
                        .eq("status", "UNREAD")
                        .set("status", "READ")
        );
        return Result.success();
    }
}
