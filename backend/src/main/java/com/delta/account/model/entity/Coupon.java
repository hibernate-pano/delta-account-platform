package com.delta.account.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("coupons")
public class Coupon {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String code;           // 优惠券码
    private String name;           // 名称
    private String type;           // 类型: DISCOUNT, CASH
    private BigDecimal value;     // 折扣值或金额
    private BigDecimal minAmount; // 最低消费金额
    private Integer totalCount;    // 发放总量
    private Integer usedCount;     // 已使用数量
    private Integer perUserLimit; // 每人限领数量
    private LocalDateTime validFrom; // 有效期开始
    private LocalDateTime validUntil; // 有效期结束
    private String status;         // 状态: ACTIVE, INACTIVE, EXPIRED

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
