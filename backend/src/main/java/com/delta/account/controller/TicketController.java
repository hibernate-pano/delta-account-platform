package com.delta.account.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.delta.account.common.Result;
import com.delta.account.model.dto.TicketCreateRequest;
import com.delta.account.model.entity.Ticket;
import com.delta.account.model.entity.User;
import com.delta.account.service.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@Tag(name = "工单管理")
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    @Operation(summary = "创建工单")
    public Result<Ticket> createTicket(
            @Valid @RequestBody TicketCreateRequest request,
            @AuthenticationPrincipal User user) {
        String priority = request.getPriority() != null ? request.getPriority() : "NORMAL";
        Ticket ticket = ticketService.createTicket(user, request.getType(), priority, request.getTitle(), request.getContent());
        return Result.success(ticket);
    }

    @GetMapping("/my")
    @Operation(summary = "获取我的工单")
    public Result<Page<Ticket>> getMyTickets(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        size = Math.min(size, 50);
        return Result.success(ticketService.getUserTickets(user, page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取工单详情")
    public Result<Ticket> getTicketDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return Result.success(ticketService.getTicketById(id, user));
    }

    @PostMapping("/{id}/reply")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "回复工单")
    public Result<Void> replyTicket(
            @PathVariable Long id,
            @RequestParam String reply,
            @AuthenticationPrincipal User admin) {
        ticketService.replyTicket(id, reply, admin);
        return Result.success();
    }

    @PostMapping("/{id}/close")
    @Operation(summary = "关闭工单")
    public Result<Void> closeTicket(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        ticketService.closeTicket(id, user);
        return Result.success();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "获取所有工单(管理员)")
    public Result<Page<Ticket>> getAllTickets(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        size = Math.min(size, 100);
        return Result.success(ticketService.getAllTickets(status, type, page, size));
    }
}
