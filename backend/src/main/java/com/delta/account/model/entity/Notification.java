package com.delta.account.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("notifications")
public class Notification {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long userId;
    private String type; // ORDER_PAID, ORDER_COMPLETED, ACCOUNT_VERIFIED, SYSTEM
    private String title;
    private String content;
    private String status; // UNREAD, READ
    private String relatedId; // 关联订单/账号ID
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
