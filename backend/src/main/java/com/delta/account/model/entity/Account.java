package com.delta.account.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("accounts")
public class Account {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long sellerId;
    private String title;
    private String gameRank;
    private Integer skinCount;
    private String weapons;
    private BigDecimal price;
    private BigDecimal rentalPrice;
    private String status;
    private String verificationStatus;
    private String description;
    private String images;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
    
    // 关联查询用
    @TableField(exist = false)
    private User seller;
}
