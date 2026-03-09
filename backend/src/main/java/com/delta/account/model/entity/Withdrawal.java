package com.delta.account.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("withdrawals")
public class Withdrawal {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long userId;
    private BigDecimal amount;
    private String accountType;
    private String accountNo;
    private String accountName;
    private String status;
    private String rejectReason;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
