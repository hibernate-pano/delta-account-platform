package com.delta.account.controller;

import com.delta.account.common.Result;
import com.delta.account.model.dto.DisputeCreateRequest;
import com.delta.account.model.entity.Dispute;
import com.delta.account.model.entity.User;
import com.delta.account.service.DisputeService;
import com.baomidou.mybatisplus.core.metadata.IPage;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/disputes")
@RequiredArgsConstructor
@Tag(name = "纠纷管理")
public class DisputeController {
    
    private final DisputeService disputeService;
    
    /**
     * 发起纠纷
     */
    @PostMapping
    @Operation(summary = "发起纠纷")
    public Result<Dispute> createDispute(
            @Valid @RequestBody DisputeCreateRequest request,
            @AuthenticationPrincipal User user) {
        return Result.success("纠纷已提交", disputeService.createDispute(request, user));
    }
    
    /**
     * 获取我的纠纷列表
     */
    @GetMapping("/my")
    @Operation(summary = "我的纠纷列表")
    public Result<IPage<Dispute>> getMyDisputes(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal User user) {
        return Result.success(disputeService.getMyDisputes(user, page, size));
    }
    
    /**
     * 获取纠纷详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取纠纷详情")
    public Result<Dispute> getDisputeById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return Result.success(disputeService.getDisputeById(id, user));
    }
    
    /**
     * 获取订单关联的纠纷
     */
    @GetMapping("/order/{orderId}")
    @Operation(summary = "获取订单关联的纠纷")
    public Result<Dispute> getDisputeByOrderId(@PathVariable Long orderId) {
        Dispute dispute = disputeService.getDisputeByOrderId(orderId);
        return Result.success(dispute);
    }
    
    /**
     * 取消纠纷
     */
    @PutMapping("/{id}/cancel")
    @Operation(summary = "取消纠纷")
    public Result<Void> cancelDispute(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        disputeService.cancelDispute(id, user);
        return Result.success("纠纷已取消", null);
    }
    
    /**
     * 管理后台：获取所有纠纷
     */
    @GetMapping("/admin/all")
    @Operation(summary = "获取所有纠纷(管理后台)")
    public Result<IPage<Dispute>> getAllDisputes(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {
        return Result.success(disputeService.getAllDisputes(page, size, status));
    }
    
    /**
     * 管理后台：处理纠纷
     */
    @PutMapping("/{id}/resolve")
    @Operation(summary = "处理纠纷(管理后台)")
    public Result<Void> resolveDispute(
            @PathVariable Long id,
            @RequestParam String resolution,
            @RequestParam(required = false) String adminRemark,
            @AuthenticationPrincipal User admin) {
        disputeService.resolveDispute(id, resolution, adminRemark, admin);
        return Result.success("纠纷已处理", null);
    }
    
    /**
     * 获取待处理的纠纷数量
     */
    @GetMapping("/admin/pending-count")
    @Operation(summary = "获取待处理的纠纷数量")
    public Result<Long> getPendingCount() {
        return Result.success(disputeService.getPendingDisputeCount());
    }
}