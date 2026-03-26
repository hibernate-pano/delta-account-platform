package com.delta.account.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("payments")
public class Payment {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String paymentNo;        // 支付单号
    private Long orderId;            // 关联订单ID
    private Long userId;             // 支付用户
    private BigDecimal amount;       // 支付金额
    private String paymentMethod;   // 支付方式: BALANCE, ALIPAY, WECHAT, STRIPE
    private String status;          // 状态: PENDING, SUCCESS, FAILED, REFUNDED
    private String transactionId;    // 第三方交易号
    private String channelOrderNo;   // 渠道订单号

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    private LocalDateTime paidAt;   // 支付成功时间
}
