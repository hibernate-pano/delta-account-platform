package com.delta.account.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("orders")
public class Order {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private String orderNo;
    private Long accountId;
    private Long buyerId;
    private Long sellerId;
    private String type;
    private BigDecimal amount;
    private BigDecimal deposit;
    private String status;
    private LocalDateTime rentStart;
    private LocalDateTime rentEnd;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
    
    // 关联查询用
    @TableField(exist = false)
    private String accountTitle;

    @TableField(exist = false)
    private Account account;

    @TableField(exist = false)
    private User buyer;

    @TableField(exist = false)
    private User seller;
}
