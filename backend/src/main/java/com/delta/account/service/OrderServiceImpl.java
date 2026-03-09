package com.delta.account.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.delta.account.common.BusinessException;
import com.delta.account.mapper.AccountMapper;
import com.delta.account.mapper.OrderMapper;
import com.delta.account.mapper.UserMapper;
import com.delta.account.model.dto.OrderCreateRequest;
import com.delta.account.model.entity.Account;
import com.delta.account.model.entity.Order;
import com.delta.account.model.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {
    
    private final OrderMapper orderMapper;
    private final AccountMapper accountMapper;
    private final UserMapper userMapper;
    
    @Override
    @Transactional
    public Order createOrder(OrderCreateRequest request, User user) {
        Account account = accountMapper.selectById(request.getAccountId());
        if (account == null) {
            throw new BusinessException("账号不存在");
        }
        
        if (!"ON_SALE".equals(account.getStatus())) {
            throw new BusinessException("账号不可交易");
        }
        
        if (account.getSellerId().equals(user.getId())) {
            throw new BusinessException("不能购买自己的账号");
        }
        
        Order order = new Order();
        order.setOrderNo(UUID.randomUUID().toString().replace("-", ""));
        order.setAccountId(account.getId());
        order.setBuyerId(user.getId());
        order.setSellerId(account.getSellerId());
        order.setType(request.getType());
        
        if ("RENT".equals(request.getType())) {
            order.setAmount(request.getDeposit());
            order.setDeposit(request.getDeposit());
            order.setRentStart(LocalDateTime.now());
            if (request.getRentHours() != null) {
                order.setRentEnd(LocalDateTime.now().plusHours(request.getRentHours()));
            }
        } else {
            order.setAmount(account.getPrice());
        }
        
        order.setStatus("PENDING");
        orderMapper.insert(order);
        
        return order;
    }
    
    @Override
    public Order getOrderDetail(Long id) {
        Order order = orderMapper.selectById(id);
        if (order == null) {
            throw new BusinessException("订单不存在");
        }
        return order;
    }
    
    @Override
    @Transactional
    public void payOrder(Long id, User user) {
        Order order = orderMapper.selectById(id);
        if (order == null) {
            throw new BusinessException("订单不存在");
        }
        
        if (!order.getBuyerId().equals(user.getId())) {
            throw new BusinessException("无权限操作");
        }
        
        if (!"PENDING".equals(order.getStatus())) {
            throw new BusinessException("订单状态不正确");
        }
        
        User buyer = userMapper.selectById(user.getId());
        if (buyer.getBalance().compareTo(order.getAmount()) < 0) {
            throw new BusinessException("余额不足");
        }
        
        buyer.setBalance(buyer.getBalance().subtract(order.getAmount()));
        userMapper.updateById(buyer);
        
        order.setStatus("PAID");
        orderMapper.updateById(order);
        
        if ("BUY".equals(order.getType())) {
            Account account = accountMapper.selectById(order.getAccountId());
            account.setStatus("SOLD");
            accountMapper.updateById(account);
        }
    }
    
    @Override
    @Transactional
    public void completeOrder(Long id, User user) {
        Order order = orderMapper.selectById(id);
        if (order == null) {
            throw new BusinessException("订单不存在");
        }
        
        if (!order.getBuyerId().equals(user.getId()) && !order.getSellerId().equals(user.getId())) {
            throw new BusinessException("无权限操作");
        }
        
        if (!"PAID".equals(order.getStatus()) && !"PROCESSING".equals(order.getStatus())) {
            throw new BusinessException("订单状态不正确");
        }
        
        if ("RENT".equals(order.getType())) {
            if (order.getRentEnd() != null && LocalDateTime.now().isBefore(order.getRentEnd())) {
                throw new BusinessException("租赁尚未到期");
            }
        }
        
        User seller = userMapper.selectById(order.getSellerId());
        seller.setBalance(seller.getBalance().add(order.getAmount()));
        userMapper.updateById(seller);
        
        order.setStatus("COMPLETED");
        orderMapper.updateById(order);
        
        if ("BUY".equals(order.getType())) {
            Account account = accountMapper.selectById(order.getAccountId());
            account.setSellerId(order.getBuyerId());
            account.setStatus("OFFLINE");
            accountMapper.updateById(account);
        }
    }
    
    @Override
    @Transactional
    public void cancelOrder(Long id, User user) {
        Order order = orderMapper.selectById(id);
        if (order == null) {
            throw new BusinessException("订单不存在");
        }
        
        if (!order.getBuyerId().equals(user.getId())) {
            throw new BusinessException("无权限操作");
        }
        
        if (!"PENDING".equals(order.getStatus())) {
            throw new BusinessException("订单状态不正确，无法取消");
        }
        
        order.setStatus("CANCELLED");
        orderMapper.updateById(order);
    }
    
    @Override
    public IPage<Order> getMyOrders(User user) {
        LambdaQueryWrapper<Order> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Order::getBuyerId, user.getId())
               .or()
               .eq(Order::getSellerId, user.getId())
               .orderByDesc(Order::getCreatedAt);
        return orderMapper.selectPage(new Page<>(1, 50), wrapper);
    }
}
