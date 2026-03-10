package com.delta.account.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("tickets")
public class Ticket {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;          // 提交用户
    private String ticketNo;       // 工单号
    private String type;           // 类型: QUESTION, BUG, COMPLAINT, REFUND, OTHER
    private String priority;       // 优先级: LOW, NORMAL, HIGH, URGENT
    private String title;          // 标题
    private String content;        // 内容
    private String status;         // 状态: OPEN, PROCESSING, RESOLVED, CLOSED
    private String reply;          // 客服回复

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    private LocalDateTime resolvedAt;  // 解决时间

    // 关联查询
    @TableField(exist = false)
    private User user;
}
