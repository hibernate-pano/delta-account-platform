package com.delta.account.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("audit_logs")
public class AuditLog {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long userId;           // 操作用户ID
    private String action;         // 操作类型: CREATE_ORDER, PAY_ORDER, CONFIRM_RECEIVED, CREATE_DISPUTE, etc.
    private String entityType;     // 实体类型: ORDER, ACCOUNT, USER, DISPUTE
    private Long entityId;         // 实体ID
    private String description;    // 操作描述
    private String ipAddress;      // IP地址
    private String userAgent;      // 用户代理
    private String requestParams;  // 请求参数(JSON)
    private String responseResult; // 响应结果(JSON)
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}