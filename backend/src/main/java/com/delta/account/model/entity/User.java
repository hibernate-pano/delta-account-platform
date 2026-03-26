package com.delta.account.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("users")
public class User {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;

    @JsonIgnore
    private String password;
    private String phone;
    private String email;
    private String nickname;
    private String avatar;
    private BigDecimal balance;
    private Integer creditScore;
    private String role;
    private String status;

    // 会员等级相关
    private Integer level;          // 会员等级 1-10
    private Integer experience;     // 经验值
    private Integer points;         // 积分
    private Integer totalSpent;     // 累计消费
    private Integer totalEarnings;  // 累计收入

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
