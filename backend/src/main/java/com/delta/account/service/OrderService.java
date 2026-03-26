package com.delta.account.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.delta.account.model.dto.OrderCreateRequest;
import com.delta.account.model.entity.Order;
import com.delta.account.model.entity.User;
import com.baomidou.mybatisplus.core.metadata.IPage;

public interface OrderService {
    Order createOrder(OrderCreateRequest request, User user);
    Order getOrderDetail(Long id, User user);
    Order getOrderById(Long id);
    Page<Order> getMyOrders(User user, Integer page, Integer size);
    void payOrder(Long id, User user);
    void completeOrder(Long id, User user);
    void cancelOrder(Long id, User user);
    IPage<Order> getMyOrders(User user);
}
