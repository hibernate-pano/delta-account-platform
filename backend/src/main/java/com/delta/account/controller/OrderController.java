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

import java.util.HashMap;
import java.util.Map;

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
    public Result<Map<String, Object>> getOrderDetail(@PathVariable Long id, @AuthenticationPrincipal User user) {
        Order order = orderService.getOrderDetail(id, user);
        // 附加托管状态描述
        Map<String, Object> result = new HashMap<>();
        result.put("order", order);
        result.put("escrowStatusText", orderService.getEscrowStatusText(order.getEscrowStatus()));
        result.put("escrowFreezeHours", 24);  // 冻结期24小时
        return Result.success(result);
    }
    
    @PutMapping("/{id}/pay")
    @Operation(summary = "支付订单")
    public Result<Void> payOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        orderService.payOrder(id, user);
        return Result.success("支付成功，资金已进入托管", null);
    }
    
    /**
     * 买家确认收货
     * 确认后资金仍处于托管状态，直到冻结期结束
     */
    @PutMapping("/{id}/confirm")
    @Operation(summary = "确认收货")
    public Result<Void> confirmReceived(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        orderService.confirmReceived(id, user);
        return Result.success("已确认收货，冻结期结束后自动打款给卖家", null);
    }
    
    @PutMapping("/{id}/complete")
    @Operation(summary = "完成订单")
    public Result<Void> completeOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        orderService.completeOrder(id, user);
        return Result.success("订单已完成", null);
    }
    
    @PutMapping("/{id}/cancel")
    @Operation(summary = "取消订单")
    public Result<Void> cancelOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        orderService.cancelOrder(id, user);
        return Result.success("订单已取消", null);
    }
}