package com.delta.account.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("recharges")
public class Recharge {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long userId;
    private BigDecimal amount;
    private String paymentMethod;
    private String transactionNo;
    private String status;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
