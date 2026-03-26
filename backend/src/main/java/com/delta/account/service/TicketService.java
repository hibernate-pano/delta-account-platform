package com.delta.account.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.delta.account.mapper.TicketMapper;
import com.delta.account.model.entity.Ticket;
import com.delta.account.model.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketMapper ticketMapper;

    /**
     * 创建工单
     */
    @Transactional
    public Ticket createTicket(User user, String type, String priority, String title, String content) {
        Ticket ticket = new Ticket();
        ticket.setUserId(user.getId());
        ticket.setTicketNo("TK" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        ticket.setType(type);
        ticket.setPriority(priority);
        ticket.setTitle(title);
        ticket.setContent(content);
        ticket.setStatus("OPEN");

        ticketMapper.insert(ticket);
        log.info("创建工单: ticketNo={}, userId={}", ticket.getTicketNo(), user.getId());

        return ticket;
    }

    /**
     * 用户获取自己的工单列表
     */
    public Page<Ticket> getUserTickets(User user, Integer page, Integer size) {
        Page<Ticket> pageParam = new Page<>(page, size);
        QueryWrapper<Ticket> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("user_id", user.getId());
        queryWrapper.orderByDesc("created_at");
        return ticketMapper.selectPage(pageParam, queryWrapper);
    }

    /**
     * 获取工单详情
     */
    public Ticket getTicketById(Long id, User user) {
        Ticket ticket = ticketMapper.selectById(id);
        if (ticket == null) {
            throw new com.delta.account.common.BusinessException("工单不存在");
        }
        // 用户只能查看自己的工单，管理员可以查看所有
        if (!ticket.getUserId().equals(user.getId()) && !"ADMIN".equals(user.getRole())) {
            throw new com.delta.account.common.BusinessException("无权限查看");
        }
        return ticket;
    }

    /**
     * 客服回复工单
     */
    @Transactional
    public void replyTicket(Long ticketId, String reply, User admin) {
        Ticket ticket = ticketMapper.selectById(ticketId);
        if (ticket == null) {
            throw new com.delta.account.common.BusinessException("工单不存在");
        }

        ticket.setReply(reply);
        ticket.setStatus("RESOLVED");
        ticket.setResolvedAt(LocalDateTime.now());
        ticketMapper.updateById(ticket);

        log.info("工单回复: ticketNo={}, adminId={}", ticket.getTicketNo(), admin.getId());
    }

    /**
     * 用户关闭工单
     */
    @Transactional
    public void closeTicket(Long ticketId, User user) {
        Ticket ticket = ticketMapper.selectById(ticketId);
        if (ticket == null) {
            throw new com.delta.account.common.BusinessException("工单不存在");
        }

        if (!ticket.getUserId().equals(user.getId())) {
            throw new com.delta.account.common.BusinessException("无权限操作");
        }

        ticket.setStatus("CLOSED");
        ticketMapper.updateById(ticket);
    }

    /**
     * 管理员获取所有工单
     */
    public Page<Ticket> getAllTickets(String status, String type, Integer page, Integer size) {
        Page<Ticket> pageParam = new Page<>(page, size);
        QueryWrapper<Ticket> queryWrapper = new QueryWrapper<>();
        if (status != null && !status.isEmpty()) {
            queryWrapper.eq("status", status);
        }
        if (type != null && !type.isEmpty()) {
            queryWrapper.eq("type", type);
        }
        queryWrapper.orderByDesc("created_at");
        return ticketMapper.selectPage(pageParam, queryWrapper);
    }
}
