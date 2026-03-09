package com.delta.account.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("chat_sessions")
public class ChatSession {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long accountId;
    private Long buyerId;
    private Long sellerId;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    
    @TableField(exist = false)
    private User otherUser;
}
