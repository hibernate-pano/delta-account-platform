package com.delta.account.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.delta.account.model.dto.OrderCreateRequest;
import com.delta.account.model.entity.Order;
import com.delta.account.model.entity.User;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

public interface OrderService {
    Order createOrder(OrderCreateRequest request, User user);
    Order getOrderDetail(Long id, User user);
    Order getOrderById(Long id);
    Page<Order> getMyOrders(User user, Integer page, Integer size);
    IPage<Order> getMyOrders(User user);
    
    /**
     * 支付订单 - 钱进入托管账户
     */
    void payOrder(Long id, User user);
    
    /**
     * 买家确认收货 - 结束托管期，款项可打给卖家
     */
    void confirmReceived(Long id, User user);
    
    /**
     * 完成订单 - 款项从托管转给卖家（冻结期结束后）
     */
    void completeOrder(Long id, User user);
    
    /**
     * 取消订单
     */
    void cancelOrder(Long id, User user);
    
    /**
     * 获取订单的托管状态描述
     */
    String getEscrowStatusText(String escrowStatus);
}