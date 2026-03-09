package com.delta.account.model.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class RefundApplyRequest {
    private Long orderId;
    private BigDecimal amount;
    private String reason;
    private String[] evidenceImages;
}
