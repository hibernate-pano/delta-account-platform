package com.delta.account.model.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class RechargeRequest {
    private BigDecimal amount = BigDecimal.ZERO;
    private String paymentMethod = "SIMULATED";
}
