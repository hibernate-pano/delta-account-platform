package com.delta.account.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.delta.account.model.dto.DisputeCreateRequest;
import com.delta.account.model.entity.Dispute;
import com.delta.account.model.entity.User;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

public interface DisputeService {
    
    /**
     * 发起纠纷
     */
    Dispute createDispute(DisputeCreateRequest request, User user);
    
    /**
     * 获取纠纷详情
     */
    Dispute getDisputeById(Long id, User user);
    
    /**
     * 获取我的纠纷列表
     */
    IPage<Dispute> getMyDisputes(User user, int page, int size);
    
    /**
     * 获取订单关联的纠纷
     */
    Dispute getDisputeByOrderId(Long orderId);
    
    /**
     * 取消纠纷（仅发起人可取消未处理的纠纷）
     */
    void cancelDispute(Long id, User user);
    
    /**
     * 管理员处理纠纷
     */
    void resolveDispute(Long id, String resolution, String adminRemark, User admin);
    
    /**
     * 获取所有纠纷（管理后台）
     */
    IPage<Dispute> getAllDisputes(int page, int size, String status);
    
    /**
     * 获取待处理的纠纷数量
     */
    long getPendingDisputeCount();
}