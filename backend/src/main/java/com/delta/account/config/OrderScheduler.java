package com.delta.account.config;

import com.delta.account.mapper.AccountMapper;
import com.delta.account.mapper.OrderMapper;
import com.delta.account.model.entity.Account;
import com.delta.account.model.entity.Order;
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
 * 定时任务 - 处理订单超时、租赁到期等
 */
@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class OrderScheduler {

    private final OrderMapper orderMapper;
    private final AccountMapper accountMapper;

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
                // 取消订单
                order.setStatus("CANCELLED");
                orderMapper.updateById(order);

                // 恢复账号状态
                Account account = accountMapper.selectById(order.getAccountId());
                if (account != null) {
                    if ("LOCKED".equals(account.getStatus())) {
                        account.setStatus("ON_SALE");
                    } else if ("RENTED".equals(account.getStatus())) {
                        account.setStatus("ON_SALE");
                    }
                    accountMapper.updateById(account);
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
                // 标记为已完成
                order.setStatus("COMPLETED");
                orderMapper.updateById(order);

                // 归还账号
                Account account = accountMapper.selectById(order.getAccountId());
                if (account != null && "RENTED".equals(account.getStatus())) {
                    account.setStatus("ON_SALE");
                    accountMapper.updateById(account);
                }

                log.info("Auto-completed expired rental: {}", order.getId());
            } catch (Exception e) {
                log.error("Failed to process rental {}: {}", order.getId(), e.getMessage());
            }
        }
    }
}
