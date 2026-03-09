package com.delta.account.service;

import com.delta.account.model.dto.RefundApplyRequest;
import com.delta.account.model.entity.RefundRequest;
import com.delta.account.model.entity.User;
import com.baomidou.mybatisplus.core.metadata.IPage;

public interface RefundService {
    
    RefundRequest applyRefund(RefundApplyRequest request, User user);
    
    IPage<RefundRequest> getMyRefunds(User user);
    
    RefundRequest getById(Long id);
    
    void cancelRefund(Long id, User user);
    
    IPage<RefundRequest> getAllRefunds(int page, int size);
    
    void processRefund(Long id, boolean approved, String remark, User admin);
}
