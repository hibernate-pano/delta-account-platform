package com.delta.account.controller;

import com.delta.account.common.Result;
import com.delta.account.model.dto.OrderCreateRequest;
import com.delta.account.model.entity.Order;
import com.delta.account.model.entity.User;
import com.delta.account.service.OrderService;
import com.baomidou.mybatisplus.core.metadata.IPage;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "订单管理")
public class OrderController {
    
    private final OrderService orderService;
    
    @PostMapping
    @Operation(summary = "创建订单")
    public Result<Order> createOrder(
            @Valid @RequestBody OrderCreateRequest request,
            @AuthenticationPrincipal User user) {
        return Result.success("订单创建成功", orderService.createOrder(request, user));
    }
    
    @GetMapping("/my")
    @Operation(summary = "我的订单")
    public Result<IPage<Order>> getMyOrders(@AuthenticationPrincipal User user) {
        return Result.success("获取成功", orderService.getMyOrders(user));
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "获取订单详情")
    public Result<Order> getOrderDetail(@PathVariable Long id) {
        return Result.success(orderService.getOrderDetail(id));
    }
    
    @PutMapping("/{id}/pay")
    @Operation(summary = "支付订单")
    public Result<Void> payOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        orderService.payOrder(id, user);
        return Result.success("支付成功", (Void) null);
    }
    
    @PutMapping("/{id}/complete")
    @Operation(summary = "完成订单")
    public Result<Void> completeOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        orderService.completeOrder(id, user);
        return Result.success("订单已完成", (Void) null);
    }
    
    @PutMapping("/{id}/cancel")
    @Operation(summary = "取消订单")
    public Result<Void> cancelOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        orderService.cancelOrder(id, user);
        return Result.success("订单已取消", (Void) null);
    }
}
