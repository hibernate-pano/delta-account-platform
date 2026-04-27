package com.delta.account.model.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class MarketConfigResponse {
    private String launchMode;
    private BigDecimal commissionRate;
    private String commissionDescription;
    private List<String> guaranteeHighlights;
    private Map<String, String> orderStatusLabels;
}
