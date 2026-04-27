package com.delta.account.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("disputes")
public class Dispute {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String disputeNo;          // 纠纷编号
    private Long orderId;               // 关联订单ID
    private Long initiatorId;           // 发起人ID
    private Long respondentId;          // 被投诉方ID
    
    // 纠纷原因
    private String reason;              // ACCOUNT_NOT_AS_DESCRIBED, ACCOUNT_RECOVERY, NOT_RECEIVED, FRAUD, OTHER
    
    private String description;         // 详细描述
    private String evidenceImages;      // 证据图片(JSON数组)
    
    // 状态和解决
    private String status;              // OPEN, UNDER_REVIEW, MEDIATING, RESOLVED, REJECTED
    private String resolution;          // FULL_REFUND, PARTIAL_REFUND, RELEASE_TO_SELLER, CANCELLED
    private String adminRemark;         // 管理员备注
    private LocalDateTime resolvedAt;   // 解决时间
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
    
    // 关联查询用
    @TableField(exist = false)
    private Order order;
    
    @TableField(exist = false)
    private User initiator;
    
    @TableField(exist = false)
    private User respondent;
    
    @TableField(exist = false)
    private String orderTitle;
}