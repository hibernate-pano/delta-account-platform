package com.delta.account.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.delta.account.common.BusinessException;
import com.delta.account.mapper.AccountMapper;
import com.delta.account.mapper.ChatMessageMapper;
import com.delta.account.mapper.ChatSessionMapper;
import com.delta.account.mapper.UserMapper;
import com.delta.account.model.entity.Account;
import com.delta.account.model.entity.ChatMessage;
import com.delta.account.model.entity.ChatSession;
import com.delta.account.model.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {
    
    private final ChatSessionMapper chatSessionMapper;
    private final ChatMessageMapper chatMessageMapper;
    private final UserMapper userMapper;
    private final AccountMapper accountMapper;
    
    @Override
    @Transactional
    public ChatSession createSession(Long accountId, Long sellerId, User user) {
        Account account = accountMapper.selectById(accountId);
        if (account == null) {
            throw new BusinessException("账号不存在");
        }
        
        LambdaQueryWrapper<ChatSession> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ChatSession::getAccountId, accountId)
               .and(w -> w.eq(ChatSession::getBuyerId, user.getId()).or().eq(ChatSession::getSellerId, user.getId()));
        ChatSession existing = chatSessionMapper.selectOne(wrapper);
        
        if (existing != null) {
            return existing;
        }
        
        ChatSession session = new ChatSession();
        session.setAccountId(accountId);
        session.setBuyerId(user.getId());
        session.setSellerId(sellerId);
        chatSessionMapper.insert(session);
        
        return session;
    }
    
    @Override
    public IPage<ChatSession> getSessions(User user) {
        LambdaQueryWrapper<ChatSession> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ChatSession::getBuyerId, user.getId())
               .or()
               .eq(ChatSession::getSellerId, user.getId())
               .orderByDesc(ChatSession::getLastMessageAt);
        
        Page<ChatSession> page = new Page<>(1, 50);
        IPage<ChatSession> result = chatSessionMapper.selectPage(page, wrapper);
        
        result.getRecords().forEach(session -> {
            Long otherId = session.getBuyerId().equals(user.getId()) ? session.getSellerId() : session.getBuyerId();
            session.setOtherUser(userMapper.selectById(otherId));
        });
        
        return result;
    }
    
    @Override
    public IPage<ChatMessage> getMessages(Long sessionId, User user, int page, int size) {
        ChatSession session = chatSessionMapper.selectById(sessionId);
        if (session == null) {
            throw new BusinessException("会话不存在");
        }
        
        if (!session.getBuyerId().equals(user.getId()) && !session.getSellerId().equals(user.getId())) {
            throw new BusinessException("无权限访问");
        }
        
        LambdaQueryWrapper<ChatMessage> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ChatMessage::getSessionId, sessionId)
               .orderByAsc(ChatMessage::getCreatedAt);
        
        return chatMessageMapper.selectPage(new Page<>(page, size), wrapper);
    }
    
    @Override
    @Transactional
    public ChatMessage sendMessage(Long sessionId, String content, User user) {
        ChatSession session = chatSessionMapper.selectById(sessionId);
        if (session == null) {
            throw new BusinessException("会话不存在");
        }
        
        if (!session.getBuyerId().equals(user.getId()) && !session.getSellerId().equals(user.getId())) {
            throw new BusinessException("无权限发送消息");
        }
        
        ChatMessage message = new ChatMessage();
        message.setSessionId(sessionId);
        message.setSenderId(user.getId());
        message.setContent(content);
        message.setType("TEXT");
        message.setIsRead(false);
        chatMessageMapper.insert(message);
        
        session.setLastMessage(content);
        session.setLastMessageAt(LocalDateTime.now());
        chatSessionMapper.updateById(session);
        
        return message;
    }
    
    @Override
    @Transactional
    public void markAsRead(Long sessionId, User user) {
        ChatSession session = chatSessionMapper.selectById(sessionId);
        if (session == null) {
            return;
        }
        
        if (!session.getBuyerId().equals(user.getId()) && !session.getSellerId().equals(user.getId())) {
            return;
        }
        
        ChatMessage message = new ChatMessage();
        message.setIsRead(true);
        
        LambdaQueryWrapper<ChatMessage> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ChatMessage::getSessionId, sessionId)
               .ne(ChatMessage::getSenderId, user.getId())
               .eq(ChatMessage::getIsRead, false);
        
        chatMessageMapper.update(message, wrapper);
    }
    
    @Override
    public int getUnreadCount(User user) {
        LambdaQueryWrapper<ChatSession> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ChatSession::getBuyerId, user.getId())
               .or()
               .eq(ChatSession::getSellerId, user.getId());
        
        return chatSessionMapper.selectCount(wrapper).intValue();
    }
}
