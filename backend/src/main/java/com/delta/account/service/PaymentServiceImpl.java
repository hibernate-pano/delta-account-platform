package com.delta.account.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.delta.account.common.BusinessException;
import com.delta.account.mapper.AccountMapper;
import com.delta.account.mapper.OrderMapper;
import com.delta.account.mapper.PaymentMapper;
import com.delta.account.mapper.UserMapper;
import com.delta.account.model.entity.Account;
import com.delta.account.model.entity.Order;
import com.delta.account.model.entity.Payment;
import com.delta.account.model.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentMapper paymentMapper;
    private final UserMapper userMapper;
    private final OrderMapper orderMapper;
    private final AccountMapper accountMapper;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public Payment createPayment(Order order, String paymentMethod) {
        // 检查是否已存在支付记录
        QueryWrapper<Payment> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("order_id", order.getId());
        queryWrapper.eq("status", "SUCCESS");
        Payment existingPayment = paymentMapper.selectOne(queryWrapper);
        if (existingPayment != null) {
            throw new BusinessException("订单已支付");
        }

        // 创建新的支付记录
        Payment payment = new Payment();
        payment.setPaymentNo("PAY" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        payment.setOrderId(order.getId());
        payment.setUserId(order.getBuyerId());
        payment.setAmount(order.getAmount());
        payment.setPaymentMethod(paymentMethod);
        payment.setStatus("PENDING");

        paymentMapper.insert(payment);
        log.info("创建支付记录: paymentNo={}, orderId={}, amount={}", payment.getPaymentNo(), order.getId(), order.getAmount());

        return payment;
    }

    @Override
    @Transactional
    public void payWithBalance(Long paymentId, User user) {
        Payment payment = paymentMapper.selectById(paymentId);
        if (payment == null) {
            throw new BusinessException("支付记录不存在");
        }

        if (!"PENDING".equals(payment.getStatus())) {
            throw new BusinessException("支付状态不正确");
        }

        if (!payment.getUserId().equals(user.getId())) {
            throw new BusinessException("无权限操作");
        }

        // 检查余额
        if (user.getBalance().compareTo(payment.getAmount()) < 0) {
            throw new BusinessException("余额不足，请先充值");
        }

        // 扣款
        User updateUser = new User();
        updateUser.setId(user.getId());
        updateUser.setBalance(user.getBalance().subtract(payment.getAmount()));
        userMapper.updateById(updateUser);

        // 获取订单并锁定
        Order order = orderMapper.selectByIdForUpdate(payment.getOrderId());
        if (order == null) {
            throw new BusinessException("订单不存在");
        }

        if (!"PENDING".equals(order.getStatus())) {
            throw new BusinessException("订单状态不正确");
        }

        // 更新订单状态
        order.setStatus("PAID");
        orderMapper.updateById(order);

        // 如果是购买，更新账号状态
        if ("BUY".equals(order.getType())) {
            Account account = accountMapper.selectById(order.getAccountId());
            if (account != null) {
                account.setStatus("SOLD");
                accountMapper.updateById(account);
            }
        }

        // 更新支付状态
        payment.setStatus("SUCCESS");
        payment.setTransactionId("BAL" + System.currentTimeMillis());
        payment.setPaidAt(LocalDateTime.now());
        paymentMapper.updateById(payment);

        // 通知卖家
        notificationService.notifyOrderPaid(order.getSellerId(), order.getId());

        log.info("余额支付成功: paymentNo={}, userId={}, amount={}", payment.getPaymentNo(), user.getId(), payment.getAmount());
    }

    @Override
    @Transactional
    public void handlePaymentCallback(String paymentNo, String transactionId, String status) {
        QueryWrapper<Payment> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("payment_no", paymentNo);
        Payment payment = paymentMapper.selectOne(queryWrapper);

        if (payment == null) {
            log.error("支付回调找不到记录: paymentNo={}", paymentNo);
            return;
        }

        payment.setTransactionId(transactionId);
        payment.setStatus(status);
        if ("SUCCESS".equals(status)) {
            payment.setPaidAt(LocalDateTime.now());
        }
        paymentMapper.updateById(payment);

        log.info("支付回调处理: paymentNo={}, status={}, transactionId={}", paymentNo, status, transactionId);
    }

    @Override
    @Transactional
    public void refund(Long paymentId, User user, String reason) {
        Payment payment = paymentMapper.selectById(paymentId);
        if (payment == null) {
            throw new BusinessException("支付记录不存在");
        }

        if (!"SUCCESS".equals(payment.getStatus())) {
            throw new BusinessException("只有已支付的订单可以退款");
        }

        // 检查权限
        Order order = orderMapper.selectById(payment.getOrderId());
        if (order == null || !order.getBuyerId().equals(user.getId())) {
            throw new BusinessException("无权限操作");
        }

        // 退款到余额
        User refundUser = userMapper.selectById(payment.getUserId());
        if (refundUser == null) {
            throw new BusinessException("用户不存在");
        }

        refundUser.setBalance(refundUser.getBalance().add(payment.getAmount()));
        userMapper.updateById(refundUser);

        // 更新支付状态
        payment.setStatus("REFUNDED");
        paymentMapper.updateById(payment);

        // 更新订单状态
        order.setStatus("REFUNDED");
        orderMapper.updateById(order);

        // 恢复账号状态
        if ("BUY".equals(order.getType())) {
            Account account = accountMapper.selectById(order.getAccountId());
            if (account != null && "SOLD".equals(account.getStatus())) {
                account.setStatus("ON_SALE");
                accountMapper.updateById(account);
            }
        }

        log.info("退款成功: paymentId={}, userId={}, amount={}", paymentId, refundUser.getId(), payment.getAmount());
    }

    @Override
    public List<Payment> getUserPayments(Long userId) {
        QueryWrapper<Payment> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("user_id", userId);
        queryWrapper.orderByDesc("created_at");
        return paymentMapper.selectList(queryWrapper);
    }

    @Override
    public Payment getPaymentByOrderId(Long orderId) {
        QueryWrapper<Payment> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("order_id", orderId);
        queryWrapper.orderByDesc("created_at");
        queryWrapper.last("LIMIT 1");
        return paymentMapper.selectOne(queryWrapper);
    }
}
