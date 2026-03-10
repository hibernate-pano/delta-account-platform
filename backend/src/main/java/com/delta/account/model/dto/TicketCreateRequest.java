package com.delta.account.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TicketCreateRequest {
    @NotBlank(message = "类型不能为空")
    private String type; // QUESTION, BUG, COMPLAINT, REFUND, OTHER

    private String priority; // LOW, NORMAL, HIGH, URGENT

    @NotBlank(message = "标题不能为空")
    private String title;

    @NotBlank(message = "内容不能为空")
    private String content;
}
