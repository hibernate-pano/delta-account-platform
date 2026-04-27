package com.delta.account.config;

import com.delta.account.mapper.AccountMapper;
import com.delta.account.mapper.OrderMapper;
import com.delta.account.mapper.UserMapper;
import com.delta.account.model.entity.Account;
import com.delta.account.model.entity.Order;
import com.delta.account.model.entity.User;
import com.delta.account.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 定时任务 - 处理订单超时、租赁到期、托管释放等
 */
@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class OrderScheduler {

    private final OrderMapper orderMapper;
    private final AccountMapper accountMapper;
    private final UserMapper userMapper;
    private final NotificationService notificationService;

    // 冻结期（小时）- 与 OrderServiceImpl 保持一致
    private static final int ESCROW_FREEZE_HOURS = 24;

    /**
     * 订单超时取消 - 每5分钟检查一次
     * PENDING 状态超过30分钟的订单自动取消
     */
    @Scheduled(fixedRate = 5 * 60 * 1000) // 5分钟
    @Transactional
    public void cancelExpiredOrders() {
        LocalDateTime timeout = LocalDateTime.now().minusMinutes(30);
        List<Order> expiredOrders = orderMapper.selectExpiredPendingOrders(timeout);

        for (Order order : expiredOrders) {
            try {
                // 只有 PENDING_RECEIVE 状态才能取消（钱没进入托管）
                if (!"PENDING".equals(order.getStatus())) {
                    continue;
                }

                // 取消订单
                order.setStatus("CANCELLED");
                if (order.getEscrowStatus() == null) {
                    order.setEscrowStatus("RELEASED");
                }
                orderMapper.updateById(order);

                // 恢复账号状态
                Account account = accountMapper.selectById(order.getAccountId());
                if (account != null) {
                    if ("LOCKED".equals(account.getStatus()) || "RENTED".equals(account.getStatus())) {
                        account.setStatus("ON_SALE");
                        accountMapper.updateById(account);
                    }
                }

                log.info("Auto-cancelled expired order: {}", order.getId());
            } catch (Exception e) {
                log.error("Failed to cancel order {}: {}", order.getId(), e.getMessage());
            }
        }
    }

    /**
     * 租赁到期处理 - 每10分钟检查一次
     */
    @Scheduled(fixedRate = 10 * 60 * 1000) // 10分钟
    @Transactional
    public void processExpiredRentals() {
        LocalDateTime now = LocalDateTime.now();
        List<Order> expiredRentals = orderMapper.selectExpiredRentals(now);

        for (Order order : expiredRentals) {
            try {
                // 检查托管状态
                if ("DISPUTED".equals(order.getEscrowStatus()) || "REFUNDED".equals(order.getEscrowStatus())) {
                    continue;
                }

                // 标记为已完成
                order.setStatus("COMPLETED");
                order.setEscrowStatus("RELEASED");
                orderMapper.updateById(order);

                // 打款给卖家
                User seller = userMapper.selectById(order.getSellerId());
                if (seller != null) {
                    java.math.BigDecimal amount = order.getEscrowAmount() != null 
                            ? order.getEscrowAmount() : order.getAmount();
                    seller.setBalance(seller.getBalance().add(amount));
                    userMapper.updateById(seller);
                }

                // 归还账号
                Account account = accountMapper.selectById(order.getAccountId());
                if (account != null && "RENTED".equals(account.getStatus())) {
                    account.setStatus("ON_SALE");
                    accountMapper.updateById(account);
                }

                // 通知卖家
                notificationService.notifyOrderCompleted(order.getSellerId(), order.getId());

                log.info("Auto-completed expired rental: {}", order.getId());
            } catch (Exception e) {
                log.error("Failed to process rental {}: {}", order.getId(), e.getMessage());
            }
        }
    }

    /**
     * 托管释放处理 - 每15分钟检查一次
     * 自动释放冻结期结束的订单款项给卖家
     */
    @Scheduled(fixedRate = 15 * 60 * 1000) // 15分钟
    @Transactional
    public void releaseEscrowOrders() {
        LocalDateTime now = LocalDateTime.now();
        
        // 查询所有冻结期已结束但未释放的订单
        List<Order> ordersToRelease = orderMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Order>()
                        .eq(Order::getEscrowStatus, "IN_ESCROW")
                        .eq(Order::getStatus, "PAID")
                        .lt(Order::getEscrowReleaseAt, now)
        );

        for (Order order : ordersToRelease) {
            try {
                // 打款给卖家
                User seller = userMapper.selectById(order.getSellerId());
                if (seller != null) {
                    java.math.BigDecimal amount = order.getEscrowAmount() != null 
                            ? order.getEscrowAmount() : order.getAmount();
                    seller.setBalance(seller.getBalance().add(amount));
                    userMapper.updateById(seller);
                }

                // 更新订单状态
                order.setStatus("COMPLETED");
                order.setEscrowStatus("RELEASED");
                orderMapper.updateById(order);

                // 如果是购买，更新账号归属
                if ("BUY".equals(order.getType())) {
                    Account account = accountMapper.selectById(order.getAccountId());
                    if (account != null) {
                        account.setSellerId(order.getBuyerId());
                        account.setStatus("SOLD");
                        accountMapper.updateById(account);
                    }
                } else if ("RENT".equals(order.getType())) {
                    Account account = accountMapper.selectById(order.getAccountId());
                    if (account != null) {
                        account.setStatus("ON_SALE");
                        accountMapper.updateById(account);
                    }
                }

                // 通知卖家
                notificationService.notifyOrderCompleted(order.getSellerId(), order.getId());

                log.info("Auto-released escrow for order: {}", order.getId());
            } catch (Exception e) {
                log.error("Failed to release escrow for order {}: {}", order.getId(), e.getMessage());
            }
        }
    }

    /**
     * 冻结期即将结束的提醒 - 每小时检查一次
     * 在冻结期结束前1小时提醒卖家
     */
    @Scheduled(fixedRate = 60 * 60 * 1000) // 1小时
    public void notifyReleasingEscrow() {
        LocalDateTime oneHourLater = LocalDateTime.now().plusHours(1);
        LocalDateTime now = LocalDateTime.now();

        // 查询1小时后即将释放的订单
        List<Order> orders = orderMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Order>()
                        .eq(Order::getEscrowStatus, "IN_ESCROW")
                        .ge(Order::getEscrowReleaseAt, now)
                        .le(Order::getEscrowReleaseAt, oneHourLater)
        );

        for (Order order : orders) {
            try {
                long hoursLeft = java.time.Duration.between(now, order.getEscrowReleaseAt()).toHours();
                if (hoursLeft > 0 && hoursLeft <= 1) {
                    notificationService.notifyEscrowReleasing(order.getSellerId(), order.getId(), (int) hoursLeft);
                    log.info("Notified escrow releasing for order: {}", order.getId());
                }
            } catch (Exception e) {
                log.error("Failed to notify escrow releasing for order {}: {}", order.getId(), e.getMessage());
            }
        }
    }

    /**
     * 清理无效的请求记录 - 每小时执行一次
     * 清理超过7天的审计日志（可选）
     */
    @Scheduled(fixedRate = 60 * 60 * 1000) // 1小时
    public void cleanupOldData() {
        // 可以在这里添加清理逻辑
        // 注意：如果要删除审计日志，需要确保满足合规要求
        log.debug("Cleanup task running...");
    }
}