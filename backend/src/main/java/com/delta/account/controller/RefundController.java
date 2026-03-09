package com.delta.account.controller;

import com.delta.account.common.Result;
import com.delta.account.model.dto.RefundApplyRequest;
import com.delta.account.model.entity.RefundRequest;
import com.delta.account.model.entity.User;
import com.delta.account.service.RefundService;
import com.baomidou.mybatisplus.core.metadata.IPage;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/refunds")
@RequiredArgsConstructor
@Tag(name = "退款管理")
public class RefundController {
    
    private final RefundService refundService;
    
    @PostMapping
    @Operation(summary = "申请退款")
    public Result<RefundRequest> applyRefund(
            @RequestBody RefundApplyRequest request,
            @AuthenticationPrincipal User user) {
        return Result.success("退款申请已提交", refundService.applyRefund(request, user));
    }
    
    @GetMapping("/my")
    @Operation(summary = "我的退款列表")
    public Result<IPage<RefundRequest>> getMyRefunds(@AuthenticationPrincipal User user) {
        return Result.success("获取成功", refundService.getMyRefunds(user));
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "退款详情")
    public Result<RefundRequest> getById(@PathVariable Long id) {
        return Result.success("获取成功", refundService.getById(id));
    }
    
    @PutMapping("/{id}/cancel")
    @Operation(summary = "取消退款")
    public Result<Void> cancelRefund(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        refundService.cancelRefund(id, user);
        return Result.success("取消成功", (Void) null);
    }
    
    @GetMapping("/admin/list")
    @Operation(summary = "所有退款列表(管理员)")
    public Result<IPage<RefundRequest>> getAllRefunds(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal User user) {
        if (!"ADMIN".equals(user.getRole())) {
            return Result.error("无权限");
        }
        return Result.success("获取成功", refundService.getAllRefunds(page, size));
    }
    
    @PutMapping("/{id}/process")
    @Operation(summary = "处理退款(管理员)")
    public Result<Void> processRefund(
            @PathVariable Long id,
            @RequestBody Map<String, Object> data,
            @AuthenticationPrincipal User user) {
        if (!"ADMIN".equals(user.getRole())) {
            return Result.error("无权限");
        }
        Boolean approved = (Boolean) data.get("approved");
        String remark = (String) data.get("remark");
        refundService.processRefund(id, approved, remark, user);
        return Result.success("处理成功", (Void) null);
    }
}
