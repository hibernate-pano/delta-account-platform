package com.delta.account.model.dto;

import com.delta.account.config.ValidImageUrls;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class AccountCreateRequest {
    @NotBlank(message = "标题不能为空")
    @Size(max = 100, message = "标题最长100字符")
    private String title;

    @Size(max = 50, message = "段位最长50字符")
    private String gameRank;

    @Min(value = 0, message = "皮肤数量不能为负数")
    private Integer skinCount;

    @Size(max = 500, message = "武器装备描述最长500字符")
    private String weapons;

    @NotNull(message = "价格不能为空")
    @DecimalMin(value = "0.01", message = "价格必须大于0")
    @DecimalMax(value = "999999.99", message = "价格不能超过999999.99")
    private BigDecimal price;

    @DecimalMin(value = "0.01", message = "租赁价格必须大于0")
    @DecimalMax(value = "9999.99", message = "租赁价格不能超过9999.99")
    private BigDecimal rentalPrice;

    @Size(max = 2000, message = "描述最长2000字符")
    private String description;

    @ValidImageUrls(message = "无效的图片URL格式，支持 jpg/jpeg/png/gif/webp/svg")
    private String images;
}
