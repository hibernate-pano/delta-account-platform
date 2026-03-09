package com.delta.account.service;

import com.delta.account.model.entity.ChatMessage;
import com.delta.account.model.entity.ChatSession;
import com.delta.account.model.entity.User;
import com.baomidou.mybatisplus.core.metadata.IPage;
import java.util.List;

public interface MessageService {
    
    ChatSession createSession(Long accountId, Long sellerId, User user);
    
    IPage<ChatSession> getSessions(User user);
    
    IPage<ChatMessage> getMessages(Long sessionId, User user, int page, int size);
    
    ChatMessage sendMessage(Long sessionId, String content, User user);
    
    void markAsRead(Long sessionId, User user);
    
    int getUnreadCount(User user);
}
