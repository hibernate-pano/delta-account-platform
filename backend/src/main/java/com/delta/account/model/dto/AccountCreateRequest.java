package com.delta.account.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class AccountCreateRequest {
    @NotBlank(message = "标题不能为空")
    private String title;
    
    private String gameRank;
    private Integer skinCount;
    private String weapons;
    
    @NotNull(message = "价格不能为空")
    private BigDecimal price;
    
    private BigDecimal rentalPrice;
    private String description;
    private String images;
}
