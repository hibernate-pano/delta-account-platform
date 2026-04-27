package com.delta.account.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class DisputeCreateRequest {
    
    @NotNull(message = "订单ID不能为空")
    private Long orderId;
    
    @NotBlank(message = "纠纷原因不能为空")
    private String reason;  // ACCOUNT_NOT_AS_DESCRIBED, ACCOUNT_RECOVERY, NOT_RECEIVED, FRAUD, OTHER
    
    @NotBlank(message = "详细描述不能为空")
    private String description;
    
    private List<String> evidenceImages;  // 证据图片URL列表
}