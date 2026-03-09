package com.delta.account.service;

import com.delta.account.model.dto.OrderCreateRequest;
import com.delta.account.model.entity.Order;
import com.delta.account.model.entity.User;

public interface OrderService {
    Order createOrder(OrderCreateRequest request, User user);
    Order getOrderDetail(Long id);
    void payOrder(Long id, User user);
    void completeOrder(Long id, User user);
    void cancelOrder(Long id, User user);
}
