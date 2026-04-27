package com.delta.account.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("chat_messages")
public class ChatMessage {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long sessionId;
    private Long senderId;
    private String content;
    private String type;
    private Boolean isRead;
    private Boolean isRecalled;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
