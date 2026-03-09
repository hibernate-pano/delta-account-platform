package com.delta.account.service;

import com.delta.account.mapper.NotificationMapper;
import com.delta.account.model.entity.Notification;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationService {
    
    private final NotificationMapper notificationMapper;
    
    @Async
    public void sendNotification(Long userId, String type, String title, String content, String relatedId) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setRelatedId(relatedId);
        notification.setStatus("UNREAD");
        
        notificationMapper.insert(notification);
    }
    
    public void notifyOrderPaid(Long userId, Long orderId) {
        sendNotification(userId, "ORDER_PAID", "订单已支付", 
                "您的订单 #" + orderId + " 已支付成功", String.valueOf(orderId));
    }
    
    public void notifyOrderCompleted(Long userId, Long orderId) {
        sendNotification(userId, "ORDER_COMPLETED", "订单已完成", 
                "您的订单 #" + orderId + " 已完成", String.valueOf(orderId));
    }
    
    public void notifyAccountVerified(Long userId, Long accountId) {
        sendNotification(userId, "ACCOUNT_VERIFIED", "账号审核通过", 
                "您发布的账号已通过审核", String.valueOf(accountId));
    }
}
