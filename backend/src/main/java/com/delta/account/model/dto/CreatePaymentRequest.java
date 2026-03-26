package com.delta.account.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class CreatePaymentRequest {
    @NotNull(message = "订单ID不能为空")
    private Long orderId;

    @NotNull(message = "支付方式不能为空")
    private String paymentMethod; // BALANCE, ALIPAY, WECHAT, STRIPE

    private String returnUrl; // 支付返回地址
}
