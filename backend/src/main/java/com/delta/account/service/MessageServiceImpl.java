package com.delta.account.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.delta.account.mapper.ChatSessionMapper;
import com.delta.account.mapper.ChatMessageMapper;
import com.delta.account.mapper.UserMapper;
import com.delta.account.model.entity.ChatSession;
import com.delta.account.model.entity.ChatMessage;
import com.delta.account.model.entity.User;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final ChatSessionMapper sessionMapper;
    private final ChatMessageMapper messageMapper;
    private final UserMapper userMapper;

    @Override
    @Transactional
    public ChatSession createSession(Long accountId, Long sellerId, User user) {
        // 查找是否已存在会话
        LambdaQueryWrapper<ChatSession> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ChatSession::getBuyerId, user.getId())
               .eq(ChatSession::getSellerId, sellerId)
               .eq(ChatSession::getAccountId, accountId);
        ChatSession existing = sessionMapper.selectOne(wrapper);

        if (existing != null) {
            return existing;
        }

        // 创建新会话
        ChatSession session = new ChatSession();
        session.setBuyerId(user.getId());
        session.setSellerId(sellerId);
        session.setAccountId(accountId);
        sessionMapper.insert(session);

        log.info("New session created: buyerId={}, sellerId={}, accountId={}", user.getId(), sellerId, accountId);
        return session;
    }

    @Override
    public IPage<ChatSession> getSessions(User user) {
        LambdaQueryWrapper<ChatSession> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ChatSession::getBuyerId, user.getId())
               .or()
               .eq(ChatSession::getSellerId, user.getId())
               .orderByDesc(ChatSession::getLastMessageAt);
        
        Page<ChatSession> page = new Page<>(1, 100);  // 获取所有会话
        return sessionMapper.selectPage(page, wrapper);
    }

    @Override
    public IPage<ChatMessage> getMessages(Long sessionId, User user, int page, int size) {
        // 验证用户是否有权限访问此会话
        ChatSession session = sessionMapper.selectById(sessionId);
        if (session == null) {
            throw new IllegalArgumentException("会话不存在");
        }
        if (!session.getBuyerId().equals(user.getId()) && !session.getSellerId().equals(user.getId())) {
            throw new IllegalArgumentException("无权限访问此会话");
        }

        // 获取消息
        LambdaQueryWrapper<ChatMessage> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ChatMessage::getSessionId, sessionId)
               .orderByAsc(ChatMessage::getCreatedAt);
        
        Page<ChatMessage> pageParam = new Page<>(page, size);
        IPage<ChatMessage> messages = messageMapper.selectPage(pageParam, wrapper);

        // 标记消息为已读
        for (ChatMessage message : messages.getRecords()) {
            if (!message.getSenderId().equals(user.getId()) && !Boolean.TRUE.equals(message.getIsRead())) {
                message.setIsRead(true);
                messageMapper.updateById(message);
            }
        }

        return messages;
    }

    @Override
    @Transactional
    public ChatMessage sendMessage(Long sessionId, String content, User user) {
        ChatSession session = sessionMapper.selectById(sessionId);
        if (session == null) {
            throw new IllegalArgumentException("会话不存在");
        }

        // 验证发送者权限
        if (!session.getBuyerId().equals(user.getId()) && !session.getSellerId().equals(user.getId())) {
            throw new IllegalArgumentException("无权限发送消息");
        }

        // 创建消息
        ChatMessage message = new ChatMessage();
        message.setSessionId(sessionId);
        message.setSenderId(user.getId());
        message.setContent(content);
        message.setType("TEXT");
        message.setIsRead(false);
        messageMapper.insert(message);

        // 更新会话的最后消息
        session.setLastMessage(content);
        session.setLastMessageAt(LocalDateTime.now());
        sessionMapper.updateById(session);

        log.info("Message sent: sessionId={}, senderId={}", sessionId, user.getId());
        return message;
    }

    @Override
    @Transactional
    public void markAsRead(Long sessionId, User user) {
        LambdaQueryWrapper<ChatMessage> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ChatMessage::getSessionId, sessionId)
               .eq(ChatMessage::getIsRead, false)
               .ne(ChatMessage::getSenderId, user.getId());
        
        List<ChatMessage> unreadMessages = messageMapper.selectList(wrapper);
        for (ChatMessage message : unreadMessages) {
            message.setIsRead(true);
            messageMapper.updateById(message);
        }
        
        log.info("Marked {} messages as read in session {}", unreadMessages.size(), sessionId);
    }

    @Override
    public int getUnreadCount(User user) {
        List<ChatSession> sessions = getSessions(user).getRecords();
        int count = 0;
        for (ChatSession session : sessions) {
            LambdaQueryWrapper<ChatMessage> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(ChatMessage::getSessionId, session.getId())
                   .eq(ChatMessage::getIsRead, false)
                   .ne(ChatMessage::getSenderId, user.getId());
            count += messageMapper.selectCount(wrapper).intValue();
        }
        return count;
    }
}