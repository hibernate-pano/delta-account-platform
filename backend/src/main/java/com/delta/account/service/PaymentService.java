package com.delta.account.service;

import com.delta.account.model.dto.CreatePaymentRequest;
import com.delta.account.model.entity.Order;
import com.delta.account.model.entity.Payment;
import com.delta.account.model.entity.User;

import java.math.BigDecimal;
import java.util.List;

public interface PaymentService {

    /**
     * 创建支付记录
     */
    Payment createPayment(Order order, String paymentMethod);

    /**
     * 处理支付 - 余额支付
     */
    void payWithBalance(Long paymentId, User user);

    /**
     * 第三方支付回调处理
     */
    void handlePaymentCallback(String paymentNo, String transactionId, String status);

    /**
     * 申请退款
     */
    void refund(Long paymentId, User user, String reason);

    /**
     * 获取用户支付记录
     */
    List<Payment> getUserPayments(Long userId);

    /**
     * 根据订单获取支付记录
     */
    Payment getPaymentByOrderId(Long orderId);
}
