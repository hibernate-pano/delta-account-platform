package com.delta.account.model.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class WithdrawRequest {
    private BigDecimal amount;
    private String accountType = "ALIPAY";
    private String accountNo;
    private String accountName;
}
