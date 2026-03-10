package com.delta.account.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("user_coupons")
public class UserCoupon {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;       // 用户ID
    private Long couponId;     // 优惠券ID
    private String status;     // 状态: UNUSED, USED, EXPIRED

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    private LocalDateTime usedAt;   // 使用时间

    // 关联查询
    @TableField(exist = false)
    private Coupon coupon;
}
