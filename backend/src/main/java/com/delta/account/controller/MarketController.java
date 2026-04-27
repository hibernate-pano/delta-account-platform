package com.delta.account.controller;

import com.delta.account.common.Result;
import com.delta.account.model.dto.MarketConfigResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/market")
@Tag(name = "市场配置")
public class MarketController {

    @Value("${market.launch-mode:GUARANTEED_ONLY}")
    private String launchMode;

    @Value("${market.commission-rate:0.05}")
    private BigDecimal commissionRate;

    @Value("${market.commission-description:仅在交易成功后收取佣金，未成交不收费}")
    private String commissionDescription;

    @Value("${market.guarantee-highlights:平台担保交易,卖家资质审核,订单全程可追踪,争议仲裁支持}")
    private String guaranteeHighlights;

    @GetMapping("/config")
    @Operation(summary = "获取市场规则配置")
    public Result<MarketConfigResponse> getMarketConfig() {
        List<String> guaranteeList = Arrays.stream(guaranteeHighlights.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        Map<String, String> orderStatusLabels = new LinkedHashMap<>();
        orderStatusLabels.put("PENDING", "待支付");
        orderStatusLabels.put("PAID", "已支付");
        orderStatusLabels.put("PROCESSING", "处理中");
        orderStatusLabels.put("COMPLETED", "已完成");
        orderStatusLabels.put("CANCELLED", "已取消");
        orderStatusLabels.put("REFUNDED", "已退款");

        MarketConfigResponse response = MarketConfigResponse.builder()
                .launchMode(launchMode)
                .commissionRate(commissionRate)
                .commissionDescription(commissionDescription)
                .guaranteeHighlights(guaranteeList)
                .orderStatusLabels(orderStatusLabels)
                .build();

        return Result.success(response);
    }
}
