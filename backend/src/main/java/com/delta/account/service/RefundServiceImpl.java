package com.delta.account.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.delta.account.common.BusinessException;
import com.delta.account.mapper.OrderMapper;
import com.delta.account.mapper.RefundRequestMapper;
import com.delta.account.mapper.TransactionRecordMapper;
import com.delta.account.mapper.UserMapper;
import com.delta.account.model.dto.RefundApplyRequest;
import com.delta.account.model.entity.Order;
import com.delta.account.model.entity.RefundRequest;
import com.delta.account.model.entity.TransactionRecord;
import com.delta.account.model.entity.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class RefundServiceImpl implements RefundService {
    
    private final RefundRequestMapper refundRequestMapper;
    private final OrderMapper orderMapper;
    private final UserMapper userMapper;
    private final TransactionRecordMapper transactionRecordMapper;
    private final ObjectMapper objectMapper;
    
    @Override
    @Transactional
    public RefundRequest applyRefund(RefundApplyRequest request, User user) {
        Order order = orderMapper.selectById(request.getOrderId());
        if (order == null) {
            throw new BusinessException("订单不存在");
        }
        
        if (!order.getBuyerId().equals(user.getId())) {
            throw new BusinessException("无权限操作");
        }
        
        if (!"PAID".equals(order.getStatus()) && !"PROCESSING".equals(order.getStatus())) {
            throw new BusinessException("订单状态不支持退款");
        }
        
        LambdaQueryWrapper<RefundRequest> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(RefundRequest::getOrderId, request.getOrderId())
               .ne(RefundRequest::getStatus, "CANCELLED")
               .ne(RefundRequest::getStatus, "REJECTED");
        
        if (refundRequestMapper.selectCount(wrapper) > 0) {
            throw new BusinessException("该订单已有退款申请");
        }
        
        RefundRequest refund = new RefundRequest();
        refund.setOrderId(request.getOrderId());
        refund.setUserId(user.getId());
        refund.setAmount(request.getAmount() != null ? request.getAmount() : order.getAmount());
        refund.setReason(request.getReason());
        
        if (request.getEvidenceImages() != null && request.getEvidenceImages().length > 0) {
            try {
                refund.setEvidenceImages(objectMapper.writeValueAsString(request.getEvidenceImages()));
            } catch (Exception e) {
                // skip
            }
        }
        
        refund.setStatus("PENDING");
        refundRequestMapper.insert(refund);
        
        return refund;
    }
    
    @Override
    public IPage<RefundRequest> getMyRefunds(User user) {
        LambdaQueryWrapper<RefundRequest> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(RefundRequest::getUserId, user.getId())
               .orderByDesc(RefundRequest::getCreatedAt);
        return refundRequestMapper.selectPage(new Page<>(1, 50), wrapper);
    }
    
    @Override
    public RefundRequest getById(Long id) {
        return refundRequestMapper.selectById(id);
    }
    
    @Override
    @Transactional
    public void cancelRefund(Long id, User user) {
        RefundRequest refund = refundRequestMapper.selectById(id);
        if (refund == null) {
            throw new BusinessException("退款申请不存在");
        }
        
        if (!refund.getUserId().equals(user.getId())) {
            throw new BusinessException("无权限操作");
        }
        
        if (!"PENDING".equals(refund.getStatus())) {
            throw new BusinessException("当前状态无法取消");
        }
        
        refund.setStatus("CANCELLED");
        refundRequestMapper.updateById(refund);
    }
    
    @Override
    public IPage<RefundRequest> getAllRefunds(int page, int size) {
        LambdaQueryWrapper<RefundRequest> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(RefundRequest::getCreatedAt);
        return refundRequestMapper.selectPage(new Page<>(page, size), wrapper);
    }
    
    @Override
    @Transactional
    public void processRefund(Long id, boolean approved, String remark, User admin) {
        RefundRequest refund = refundRequestMapper.selectById(id);
        if (refund == null) {
            throw new BusinessException("退款申请不存在");
        }
        
        if (!"PENDING".equals(refund.getStatus()) && !"PROCESSING".equals(refund.getStatus())) {
            throw new BusinessException("当前状态无法处理");
        }
        
        Order order = orderMapper.selectById(refund.getOrderId());
        
        if (approved) {
            refund.setStatus("AGREED");
            order.setStatus("REFUNDED");
            orderMapper.updateById(order);
            
            User buyer = userMapper.selectById(refund.getUserId());
            BigDecimal balanceBefore = buyer.getBalance();
            buyer.setBalance(balanceBefore.add(refund.getAmount()));
            userMapper.updateById(buyer);
            
            TransactionRecord record = new TransactionRecord();
            record.setUserId(buyer.getId());
            record.setType("REFUND");
            record.setAmount(refund.getAmount());
            record.setBalanceBefore(balanceBefore);
            record.setBalanceAfter(buyer.getBalance());
            record.setDescription("退款 - 订单号: " + order.getOrderNo());
            record.setStatus("COMPLETED");
            record.setOrderId(order.getId());
            transactionRecordMapper.insert(record);
        } else {
            refund.setStatus("REJECTED");
        }
        
        refund.setAdminRemark(remark);
        refundRequestMapper.updateById(refund);
    }
}
