package com.delta.account.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("refund_requests")
public class RefundRequest {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long orderId;
    private Long userId;
    private BigDecimal amount;
    private String reason;
    private String evidenceImages;
    private String status;
    private String adminRemark;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
    
    @TableField(exist = false)
    private Order order;
}
