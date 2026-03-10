package com.delta.account.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("audit_logs")
public class AuditLog {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;
    private String username;
    private String action;         // 操作类型: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    private String resource;      // 资源类型: Account, Order, User, etc.
    private Long resourceId;      // 资源ID
    private String method;         // HTTP方法
    private String ip;
    private String userAgent;
    private String requestUri;
    private String requestBody;    // 请求体（脱敏）
    private String responseStatus;
    private String errorMessage;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
