package com.delta.account.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Map;

@Data
public class AnalyticsEventRequest {

    @NotBlank(message = "eventName不能为空")
    private String eventName;

    @NotBlank(message = "page不能为空")
    private String page;

    private Map<String, Object> metadata;
}
