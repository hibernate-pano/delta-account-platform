package com.delta.account.controller;

import com.delta.account.common.Result;
import com.delta.account.model.dto.CreatePaymentRequest;
import com.delta.account.model.entity.Order;
import com.delta.account.model.entity.Payment;
import com.delta.account.model.entity.User;
import com.delta.account.service.NotificationService;
import com.delta.account.service.OrderService;
import com.delta.account.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "支付管理")
public class PaymentController {

    private final PaymentService paymentService;
    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "创建支付")
    public Result<Payment> createPayment(
            @Valid @RequestBody CreatePaymentRequest request,
            @AuthenticationPrincipal User user) {
        Order order = orderService.getOrderById(request.getOrderId());
        if (order == null) {
            return Result.error("订单不存在");
        }
        if (!order.getBuyerId().equals(user.getId())) {
            return Result.error("无权限操作");
        }
        Payment payment = paymentService.createPayment(order, request.getPaymentMethod());
        return Result.success(payment);
    }

    @PostMapping("/{id}/pay")
    @Operation(summary = "余额支付")
    public Result<Void> payWithBalance(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        paymentService.payWithBalance(id, user);
        return Result.success();
    }

    @GetMapping("/order/{orderId}")
    @Operation(summary = "获取订单支付记录")
    public Result<Payment> getPaymentByOrderId(@PathVariable Long orderId) {
        Payment payment = paymentService.getPaymentByOrderId(orderId);
        return Result.success(payment);
    }

    @GetMapping("/my")
    @Operation(summary = "获取我的支付记录")
    public Result<List<Payment>> getMyPayments(@AuthenticationPrincipal User user) {
        List<Payment> payments = paymentService.getUserPayments(user.getId());
        return Result.success(payments);
    }

    @PostMapping("/{id}/refund")
    @Operation(summary = "申请退款")
    public Result<Void> refund(
            @PathVariable Long id,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal User user) {
        paymentService.refund(id, user, reason);
        return Result.success();
    }
}
