package com.delta.account.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("reviews")
public class Review {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long orderId;
    private Long reviewerId;
    private Long revieweeId;
    private Integer rating;
    private String content;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
