package com.delta.account.controller;

import com.delta.account.common.Result;
import com.delta.account.model.entity.ChatMessage;
import com.delta.account.model.entity.ChatSession;
import com.delta.account.model.entity.User;
import com.delta.account.service.MessageService;
import com.baomidou.mybatisplus.core.metadata.IPage;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@Tag(name = "消息管理")
public class MessageController {
    
    private final MessageService messageService;
    
    @PostMapping("/sessions")
    @Operation(summary = "创建会话")
    public Result<ChatSession> createSession(
            @RequestBody Map<String, Long> data,
            @AuthenticationPrincipal User user) {
        return Result.success("会话创建成功", 
            messageService.createSession(data.get("accountId"), data.get("sellerId"), user));
    }
    
    @GetMapping("/sessions")
    @Operation(summary = "获取会话列表")
    public Result<IPage<ChatSession>> getSessions(@AuthenticationPrincipal User user) {
        return Result.success("获取成功", messageService.getSessions(user));
    }
    
    @GetMapping("/sessions/{id}")
    @Operation(summary = "获取会话消息")
    public Result<IPage<ChatMessage>> getMessages(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal User user) {
        return Result.success("获取成功", messageService.getMessages(id, user, page, size));
    }
    
    @PostMapping("/sessions/{id}")
    @Operation(summary = "发送消息")
    public Result<ChatMessage> sendMessage(
            @PathVariable Long id,
            @RequestBody Map<String, String> data,
            @AuthenticationPrincipal User user) {
        return Result.success("发送成功", messageService.sendMessage(id, data.get("content"), user));
    }
    
    @PutMapping("/sessions/{id}/read")
    @Operation(summary = "标记已读")
    public Result<Void> markAsRead(@PathVariable Long id, @AuthenticationPrincipal User user) {
        messageService.markAsRead(id, user);
        return Result.success("标记成功", (Void) null);
    }
    
    @GetMapping("/unread-count")
    @Operation(summary = "未读数量")
    public Result<Integer> getUnreadCount(@AuthenticationPrincipal User user) {
        return Result.success("获取成功", messageService.getUnreadCount(user));
    }
}
