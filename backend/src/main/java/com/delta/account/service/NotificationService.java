package com.delta.account.service;

import com.delta.account.mapper.NotificationMapper;
import com.delta.account.model.entity.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationMapper notificationMapper;

    @Async
    public void sendNotification(Long userId, String type, String title, String content, String relatedId) {
        try {
            Notification notification = new Notification();
            notification.setUserId(userId);
            notification.setType(type);
            notification.setTitle(title);
            notification.setContent(content);
            notification.setRelatedId(relatedId);
            notification.setStatus("UNREAD");

            notificationMapper.insert(notification);
            log.info("站内通知发送成功: userId={}, type={}", userId, type);
        } catch (Exception e) {
            log.error("站内通知发送失败: userId={}, type={}, error={}", userId, type, e.getMessage());
        }
    }

    // Order notifications
    public void notifyOrderPaid(Long userId, Long orderId) {
        sendNotification(userId, "ORDER_PAID", "订单已支付",
                "您的订单 #" + orderId + " 已支付成功", String.valueOf(orderId));
    }

    public void notifyOrderCompleted(Long userId, Long orderId) {
        sendNotification(userId, "ORDER_COMPLETED", "订单已完成",
                "您的订单 #" + orderId + " 已完成", String.valueOf(orderId));
    }

    public void notifyOrderCancelled(Long userId, Long orderId, String reason) {
        sendNotification(userId, "ORDER_CANCELLED", "订单已取消",
                "您的订单 #" + orderId + " 已取消" + (reason != null ? "，原因：" + reason : ""), String.valueOf(orderId));
    }

    public void notifyNewOrder(Long userId, Long orderId, String accountTitle) {
        sendNotification(userId, "NEW_ORDER", "新订单通知",
                "您发布的账号 [" + accountTitle + "] 有新订单 #" + orderId, String.valueOf(orderId));
    }

    public void notifyOrderExpiring(Long userId, Long orderId, int hoursLeft) {
        sendNotification(userId, "ORDER_EXPIRING", "租赁即将到期",
                "您的租赁订单 #" + orderId + " 将在 " + hoursLeft + " 小时后到期", String.valueOf(orderId));
    }

    // Account notifications
    public void notifyAccountVerified(Long userId, Long accountId) {
        sendNotification(userId, "ACCOUNT_VERIFIED", "账号审核通过",
                "您发布的账号已通过审核", String.valueOf(accountId));
    }

    public void notifyAccountRejected(Long userId, Long accountId, String reason) {
        sendNotification(userId, "ACCOUNT_REJECTED", "账号审核拒绝",
                "您发布的账号未通过审核" + (reason != null ? "，原因：" + reason : ""), String.valueOf(accountId));
    }

    // Review notifications
    public void notifyNewReview(Long userId, Long orderId, int rating) {
        String ratingText = rating >= 5 ? "好评" : rating >= 3 ? "中评" : "差评";
        sendNotification(userId, "NEW_REVIEW", "新评价",
                "您收到了一个" + ratingText + "，订单 #" + orderId, String.valueOf(orderId));
    }

    // System notifications
    public void notifySystem(Long userId, String title, String content) {
        sendNotification(userId, "SYSTEM", title, content, null);
    }

    // Broadcast notification (admin)
    @Async
    public void broadcastNotification(String type, String title, String content) {
        // This would typically fetch all users and send notifications
        // For now, we just log it
        log.info("Broadcast notification: type={}, title={}, content={}", type, title, content);
    }
}
