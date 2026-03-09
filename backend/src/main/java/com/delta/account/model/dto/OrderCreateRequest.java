package com.delta.account.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class OrderCreateRequest {
    @NotNull(message = "账号ID不能为空")
    private Long accountId;
    
    @NotBlank(message = "交易类型不能为空")
    private String type; // BUY or RENT
    
    private BigDecimal deposit; // 租赁押金
    
    private Integer rentHours; // 租赁小时数
}
