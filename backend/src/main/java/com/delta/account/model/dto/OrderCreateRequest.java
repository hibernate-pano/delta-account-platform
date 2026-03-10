package com.delta.account.model.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class OrderCreateRequest {
    @NotNull(message = "账号ID不能为空")
    private Long accountId;

    @NotBlank(message = "交易类型不能为空")
    @Pattern(regexp = "^(BUY|RENT)$", message = "交易类型只能为BUY或RENT")
    private String type;

    private BigDecimal deposit;

    @Min(value = 1, message = "租赁时长至少1小时")
    @Max(value = 720, message = "租赁时长不能超过720小时")
    private Integer rentHours;
}
