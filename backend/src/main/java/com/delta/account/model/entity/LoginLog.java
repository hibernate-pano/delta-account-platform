package com.delta.account.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("login_logs")
public class LoginLog {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;
    private String username;
    private String ip;
    private String userAgent;
    private String action; // LOGIN, LOGOUT, REGISTER, PASSWORD_CHANGE
    private String status; // SUCCESS, FAILED
    private String reason; // 失败原因

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
