package com.delta.account.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.delta.account.common.BusinessException;
import com.delta.account.mapper.AccountMapper;
import com.delta.account.mapper.OrderMapper;
import com.delta.account.mapper.UserMapper;
import com.delta.account.model.dto.OrderCreateRequest;
import com.delta.account.model.entity.Account;
import com.delta.account.model.entity.Order;
import com.delta.account.model.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {
    
    private final OrderMapper orderMapper;
    private final AccountMapper accountMapper;
    private final UserMapper userMapper;
    private final NotificationService notificationService;
    
    // 托管状态常量
    private static final String ESCROW_PENDING_RECEIVE = "PENDING_RECEIVE";  // 待确认收货
    private static final String ESCROW_IN_ESCROW = "IN_ESCROW";             // 托管中
    private static final String ESCROW_RELEASED = "RELEASED";                // 已释放
    private static final String ESCROW_DISPUTED = "DISPUTED";                // 争议中
    private static final String ESCROW_REFUNDED = "REFUNDED";                // 已退款
    
    // 冻结期（小时）
    private static final int ESCROW_FREEZE_HOURS = 24;
    
    @Override
    @Transactional
    public Order createOrder(OrderCreateRequest request, User user) {
        Account account = accountMapper.selectById(request.getAccountId());
        if (account == null) {
            throw new BusinessException("账号不存在");
        }
        
        if (!"ON_SALE".equals(account.getStatus())) {
            throw new BusinessException("账号不可交易");
        }
        
        if (account.getSellerId().equals(user.getId())) {
            throw new BusinessException("不能购买自己的账号");
        }
        
        Order order = new Order();
        order.setOrderNo(UUID.randomUUID().toString().replace("-", ""));
        order.setAccountId(account.getId());
        order.setBuyerId(user.getId());
        order.setSellerId(account.getSellerId());
        order.setType(request.getType());
        
        if ("RENT".equals(request.getType())) {
            order.setAmount(request.getDeposit());
            order.setDeposit(request.getDeposit());
            order.setRentStart(LocalDateTime.now());
            if (request.getRentHours() != null) {
                order.setRentEnd(LocalDateTime.now().plusHours(request.getRentHours()));
            }
        } else {
            order.setAmount(account.getPrice());
        }
        
        order.setStatus("PENDING");
        // 新订单默认进入待确认收货状态
        order.setEscrowStatus(ESCROW_PENDING_RECEIVE);
        order.setEscrowAmount(order.getAmount());
        orderMapper.insert(order);
        
        log.info("Order created: orderNo={}, buyerId={}, amount={}", order.getOrderNo(), user.getId(), order.getAmount());
        return order;
    }
    
    @Override
    public Order getOrderDetail(Long id, User user) {
        Order order = orderMapper.selectById(id);
        if (order == null) {
            throw new BusinessException("订单不存在");
        }
        return order;
    }

    @Override
    public Order getOrderById(Long id) {
        return orderMapper.selectById(id);
    }
    
    @Override
    public IPage<Order> getMyOrders(User user) {
        return getMyOrders(user, 1, 50);
    }

    @Override
    public Page<Order> getMyOrders(User user, Integer page, Integer size) {
        LambdaQueryWrapper<Order> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Order::getBuyerId, user.getId())
               .or()
               .eq(Order::getSellerId, user.getId())
               .orderByDesc(Order::getCreatedAt);
        return orderMapper.selectPage(new Page<>(page, size), wrapper);
    }
    
    @Override
    @Transactional
    public void payOrder(Long id, User user) {
        Order order = orderMapper.selectById(id);
        if (order == null) {
            throw new BusinessException("订单不存在");
        }
        
        if (!order.getBuyerId().equals(user.getId())) {
            throw new BusinessException("无权限操作");
        }
        
        if (!"PENDING".equals(order.getStatus())) {
            throw new BusinessException("订单状态不正确");
        }
        
        // 检查余额
        User buyer = userMapper.selectById(user.getId());
        BigDecimal orderAmount = order.getEscrowAmount() != null ? order.getEscrowAmount() : order.getAmount();
        if (buyer.getBalance().compareTo(orderAmount) < 0) {
            throw new BusinessException("余额不足，请先充值");
        }
        
        // 扣款（钱进入托管，不再直接给卖家）
        buyer.setBalance(buyer.getBalance().subtract(orderAmount));
        userMapper.updateById(buyer);
        
        // 更新订单状态为已支付，托管状态为托管中
        order.setStatus("PAID");
        order.setEscrowStatus(ESCROW_IN_ESCROW);
        order.setEscrowAmount(orderAmount);
        orderMapper.updateById(order);
        
        // 如果是购买，锁定账号
        if ("BUY".equals(order.getType())) {
            Account account = accountMapper.selectById(order.getAccountId());
            account.setStatus("LOCKED");
            accountMapper.updateById(account);
        } else if ("RENT".equals(order.getType())) {
            Account account = accountMapper.selectById(order.getAccountId());
            account.setStatus("RENTED");
            accountMapper.updateById(account);
        }
        
        // 计算冻结期结束时间（24小时后）
        order.setEscrowReleaseAt(LocalDateTime.now().plusHours(ESCROW_FREEZE_HOURS));
        orderMapper.updateById(order);
        
        // 通知卖家有新订单
        notificationService.notifyNewOrder(order.getSellerId(), order.getId());
        
        log.info("Order paid and in escrow: orderNo={}, amount={}, releaseAt={}", 
                order.getOrderNo(), orderAmount, order.getEscrowReleaseAt());
    }
    
    @Override
    @Transactional
    public void confirmReceived(Long id, User user) {
        Order order = orderMapper.selectById(id);
        if (order == null) {
            throw new BusinessException("订单不存在");
        }
        
        // 只有买家可以确认收货
        if (!order.getBuyerId().equals(user.getId())) {
            throw new BusinessException("只有买家可以确认收货");
        }
        
        // 检查订单状态
        if (!"PAID".equals(order.getStatus())) {
            throw new BusinessException("当前状态不允许确认收货");
        }
        
        // 检查托管状态
        if (!ESCROW_IN_ESCROW.equals(order.getEscrowStatus()) && !ESCROW_PENDING_RECEIVE.equals(order.getEscrowStatus())) {
            throw new BusinessException("当前托管状态不允许确认收货");
        }
        
        // 更新确认收货时间和托管状态
        order.setReceivedAt(LocalDateTime.now());
        // 确认收货后仍然保持托管状态，直到冻结期结束
        // 但可以提前触发释放流程（可选）
        order.setEscrowStatus(ESCROW_IN_ESCROW);
        orderMapper.updateById(order);
        
        // 通知卖家已确认收货
        notificationService.notifyOrderConfirmed(order.getSellerId(), order.getId());
        
        log.info("Order confirmed received: orderNo={}, receivedAt={}", order.getOrderNo(), order.getReceivedAt());
    }
    
    @Override
    @Transactional
    public void completeOrder(Long id, User user) {
        Order order = orderMapper.selectById(id);
        if (order == null) {
            throw new BusinessException("订单不存在");
        }
        
        // 验证权限：买家或卖家都可以触发完成
        boolean isBuyer = order.getBuyerId().equals(user.getId());
        boolean isSeller = order.getSellerId().equals(user.getId());
        if (!isBuyer && !isSeller) {
            throw new BusinessException("无权限操作");
        }
        
        // 检查订单状态
        if (!"PAID".equals(order.getStatus()) && !"PROCESSING".equals(order.getStatus())) {
            throw new BusinessException("订单状态不正确");
        }
        
        // 检查托管状态（不能是争议中或已退款）
        if (ESCROW_DISPUTED.equals(order.getEscrowStatus()) || ESCROW_REFUNDED.equals(order.getEscrowStatus())) {
            throw new BusinessException("当前托管状态不允许完成订单");
        }
        
        // 检查冻结期是否已过
        if (order.getEscrowReleaseAt() != null && LocalDateTime.now().isBefore(order.getEscrowReleaseAt())) {
            long remainingHours = ChronoUnit.HOURS.between(LocalDateTime.now(), order.getEscrowReleaseAt());
            throw new BusinessException("冻结期还未结束，还剩 " + remainingHours + " 小时");
        }
        
        // 如果是租赁，检查租赁是否到期
        if ("RENT".equals(order.getType())) {
            if (order.getRentEnd() != null && LocalDateTime.now().isBefore(order.getRentEnd())) {
                throw new BusinessException("租赁尚未到期");
            }
        }
        
        // 从托管转给卖家
        User seller = userMapper.selectById(order.getSellerId());
        BigDecimal releaseAmount = order.getEscrowAmount() != null ? order.getEscrowAmount() : order.getAmount();
        seller.setBalance(seller.getBalance().add(releaseAmount));
        userMapper.updateById(seller);
        
        // 更新订单状态
        order.setStatus("COMPLETED");
        order.setEscrowStatus(ESCROW_RELEASED);
        orderMapper.updateById(order);
        
        // 如果是购买，更新账号归属
        if ("BUY".equals(order.getType())) {
            Account account = accountMapper.selectById(order.getAccountId());
            account.setSellerId(order.getBuyerId());
            account.setStatus("SOLD");
            accountMapper.updateById(account);
        } else if ("RENT".equals(order.getType())) {
            Account account = accountMapper.selectById(order.getAccountId());
            account.setStatus("ON_SALE");
            accountMapper.updateById(account);
        }
        
        log.info("Order completed and escrow released: orderNo={}, amount={}", order.getOrderNo(), releaseAmount);
    }
    
    @Override
    @Transactional
    public void cancelOrder(Long id, User user) {
        Order order = orderMapper.selectById(id);
        if (order == null) {
            throw new BusinessException("订单不存在");
        }
        
        // 只有买家可以取消
        if (!order.getBuyerId().equals(user.getId())) {
            throw new BusinessException("无权限操作");
        }
        
        if (!"PENDING".equals(order.getStatus())) {
            throw new BusinessException("订单状态不正确，无法取消");
        }
        
        order.setStatus("CANCELLED");
        order.setEscrowStatus(ESCROW_RELEASED);  // 钱没有进入托管，直接释放
        orderMapper.updateById(order);
        
        // 如果是购买，恢复账号状态
        if ("BUY".equals(order.getType())) {
            Account account = accountMapper.selectById(order.getAccountId());
            if (account != null) {
                account.setStatus("ON_SALE");
                accountMapper.updateById(account);
            }
        }
        
        log.info("Order cancelled: orderNo={}", order.getOrderNo());
    }
    
    @Override
    public String getEscrowStatusText(String escrowStatus) {
        if (escrowStatus == null) {
            return "未知状态";
        }
        Map<String, String> statusMap = new HashMap<>();
        statusMap.put(ESCROW_PENDING_RECEIVE, "等待确认收货");
        statusMap.put(ESCROW_IN_ESCROW, "资金托管中");
        statusMap.put(ESCROW_RELEASED, "已释放");
        statusMap.put(ESCROW_DISPUTED, "争议处理中");
        statusMap.put(ESCROW_REFUNDED, "已退款");
        return statusMap.getOrDefault(escrowStatus, "未知状态");
    }
}