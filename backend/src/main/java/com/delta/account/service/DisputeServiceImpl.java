package com.delta.account.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.delta.account.common.BusinessException;
import com.delta.account.mapper.DisputeMapper;
import com.delta.account.mapper.OrderMapper;
import com.delta.account.mapper.UserMapper;
import com.delta.account.model.dto.DisputeCreateRequest;
import com.delta.account.model.entity.Dispute;
import com.delta.account.model.entity.Order;
import com.delta.account.model.entity.User;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DisputeServiceImpl implements DisputeService {
    
    private final DisputeMapper disputeMapper;
    private final OrderMapper orderMapper;
    private final UserMapper userMapper;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;
    
    // 纠纷原因枚举
    public static final String REASON_ACCOUNT_NOT_AS_DESCRIBED = "ACCOUNT_NOT_AS_DESCRIBED";
    public static final String REASON_ACCOUNT_RECOVERY = "ACCOUNT_RECOVERY";
    public static final String REASON_NOT_RECEIVED = "NOT_RECEIVED";
    public static final String REASON_FRAUD = "FRAUD";
    public static final String REASON_OTHER = "OTHER";
    
    // 解决方式枚举
    public static final String RESOLUTION_FULL_REFUND = "FULL_REFUND";
    public static final String RESOLUTION_PARTIAL_REFUND = "PARTIAL_REFUND";
    public static final String RESOLUTION_RELEASE_TO_SELLER = "RELEASE_TO_SELLER";
    public static final String RESOLUTION_CANCELLED = "CANCELLED";
    
    @Override
    @Transactional
    public Dispute createDispute(DisputeCreateRequest request, User user) {
        // 1. 验证订单
        Order order = orderMapper.selectById(request.getOrderId());
        if (order == null) {
            throw new BusinessException("订单不存在");
        }
        
        // 2. 验证用户是否参与此订单
        boolean isBuyer = order.getBuyerId().equals(user.getId());
        boolean isSeller = order.getSellerId().equals(user.getId());
        if (!isBuyer && !isSeller) {
            throw new BusinessException("无权限发起此订单的纠纷");
        }
        
        // 3. 检查是否已有未解决的纠纷
        Dispute existingDispute = getDisputeByOrderId(order.getId());
        if (existingDispute != null && !"RESOLVED".equals(existingDispute.getStatus()) && !"REJECTED".equals(existingDispute.getStatus())) {
            throw new BusinessException("此订单已有进行中的纠纷");
        }
        
        // 4. 验证订单状态（只有已付款的订单才能发起纠纷）
        if (!"PAID".equals(order.getStatus()) && !"PROCESSING".equals(order.getStatus())) {
            throw new BusinessException("当前订单状态不允许发起纠纷");
        }
        
        // 5. 验证纠纷原因
        validateReason(request.getReason());
        
        // 6. 创建纠纷
        Dispute dispute = new Dispute();
        dispute.setDisputeNo(generateDisputeNo());
        dispute.setOrderId(order.getId());
        dispute.setInitiatorId(user.getId());
        dispute.setRespondentId(isBuyer ? order.getSellerId() : order.getBuyerId());
        dispute.setReason(request.getReason());
        dispute.setDescription(request.getDescription());
        
        // 处理证据图片
        if (request.getEvidenceImages() != null && !request.getEvidenceImages().isEmpty()) {
            try {
                dispute.setEvidenceImages(objectMapper.writeValueAsString(request.getEvidenceImages()));
            } catch (JsonProcessingException e) {
                log.error("Failed to serialize evidence images", e);
            }
        }
        
        dispute.setStatus("OPEN");
        disputeMapper.insert(dispute);
        
        // 7. 更新订单托管状态为争议中
        order.setEscrowStatus("DISPUTED");
        order.setDisputeId(dispute.getId());
        orderMapper.updateById(order);
        
        // 8. 通知对方
        notificationService.sendDisputeNotification(dispute.getRespondentId(), dispute.getId(), user.getNickname());
        
        log.info("Dispute created: disputeNo={}, orderId={}, initiatorId={}", dispute.getDisputeNo(), order.getId(), user.getId());
        return dispute;
    }
    
    @Override
    public Dispute getDisputeById(Long id, User user) {
        Dispute dispute = disputeMapper.selectById(id);
        if (dispute == null) {
            throw new BusinessException("纠纷不存在");
        }
        
        // 验证用户是否参与此纠纷
        boolean isParticipant = dispute.getInitiatorId().equals(user.getId()) 
                || dispute.getRespondentId().equals(user.getId())
                || "ADMIN".equals(user.getRole());
        if (!isParticipant) {
            throw new BusinessException("无权限查看此纠纷");
        }
        
        return dispute;
    }
    
    @Override
    public IPage<Dispute> getMyDisputes(User user, int page, int size) {
        LambdaQueryWrapper<Dispute> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Dispute::getInitiatorId, user.getId())
               .or()
               .eq(Dispute::getRespondentId, user.getId())
               .orderByDesc(Dispute::getCreatedAt);
        return disputeMapper.selectPage(new Page<>(page, size), wrapper);
    }
    
    @Override
    public Dispute getDisputeByOrderId(Long orderId) {
        LambdaQueryWrapper<Dispute> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Dispute::getOrderId, orderId)
               .orderByDesc(Dispute::getCreatedAt)
               .last("LIMIT 1");
        return disputeMapper.selectOne(wrapper);
    }
    
    @Override
    @Transactional
    public void cancelDispute(Long id, User user) {
        Dispute dispute = disputeMapper.selectById(id);
        if (dispute == null) {
            throw new BusinessException("纠纷不存在");
        }
        
        // 只有发起人可以取消
        if (!dispute.getInitiatorId().equals(user.getId())) {
            throw new BusinessException("只有发起人可以取消纠纷");
        }
        
        // 只有未处理的纠纷可以取消
        if (!"OPEN".equals(dispute.getStatus())) {
            throw new BusinessException("当前状态的纠纷无法取消");
        }
        
        // 更新纠纷状态
        dispute.setStatus("REJECTED");
        dispute.setResolution("CANCELLED");
        dispute.setResolvedAt(LocalDateTime.now());
        disputeMapper.updateById(dispute);
        
        // 恢复订单托管状态
        Order order = orderMapper.selectById(dispute.getOrderId());
        if (order != null) {
            order.setEscrowStatus("IN_ESCROW");
            order.setDisputeId(null);
            orderMapper.updateById(order);
        }
        
        log.info("Dispute cancelled: disputeId={}", id);
    }
    
    @Override
    @Transactional
    public void resolveDispute(Long id, String resolution, String adminRemark, User admin) {
        Dispute dispute = disputeMapper.selectById(id);
        if (dispute == null) {
            throw new BusinessException("纠纷不存在");
        }
        
        // 验证管理员权限
        if (!"ADMIN".equals(admin.getRole())) {
            throw new BusinessException("只有管理员可以处理纠纷");
        }
        
        // 验证纠纷状态
        if (!"OPEN".equals(dispute.getStatus()) && !"UNDER_REVIEW".equals(dispute.getStatus()) && !"MEDIATING".equals(dispute.getStatus())) {
            throw new BusinessException("当前状态的纠纷无法处理");
        }
        
        // 验证解决方式
        validateResolution(resolution);
        
        Order order = orderMapper.selectById(dispute.getOrderId());
        if (order == null) {
            throw new BusinessException("关联订单不存在");
        }
        
        // 更新纠纷
        dispute.setStatus("RESOLVED");
        dispute.setResolution(resolution);
        dispute.setAdminRemark(adminRemark);
        dispute.setResolvedAt(LocalDateTime.now());
        disputeMapper.updateById(dispute);
        
        // 更新订单托管状态
        order.setDisputeId(null);
        
        // 根据解决方式处理资金
        switch (resolution) {
            case RESOLUTION_FULL_REFUND:
                // 全额退款给买家
                order.setEscrowStatus("REFUNDED");
                // 资金从托管账户退回买家（通过定时任务处理）
                break;
            case RESOLUTION_PARTIAL_REFUND:
                // 部分退款（需要额外参数确定金额，暂时走全额）
                order.setEscrowStatus("REFUNDED");
                break;
            case RESOLUTION_RELEASE_TO_SELLER:
                // 打款给卖家
                order.setEscrowStatus("RELEASED");
                // 设置释放时间，让定时任务处理
                order.setEscrowReleaseAt(LocalDateTime.now());
                break;
            case RESOLUTION_CANCELLED:
                order.setEscrowStatus("RELEASED");
                order.setEscrowReleaseAt(LocalDateTime.now());
                break;
        }
        orderMapper.updateById(order);
        
        // 通知双方
        notificationService.notifyDisputeResolved(dispute.getInitiatorId(), dispute.getId(), resolution);
        notificationService.notifyDisputeResolved(dispute.getRespondentId(), dispute.getId(), resolution);
        
        // 信用分处理（如果需要）
        handleCreditScoreImpact(dispute, resolution);
        
        log.info("Dispute resolved: disputeId={}, resolution={}, adminId={}", id, resolution, admin.getId());
    }
    
    @Override
    public IPage<Dispute> getAllDisputes(int page, int size, String status) {
        LambdaQueryWrapper<Dispute> wrapper = new LambdaQueryWrapper<>();
        if (status != null && !status.isEmpty()) {
            wrapper.eq(Dispute::getStatus, status);
        }
        wrapper.orderByDesc(Dispute::getCreatedAt);
        return disputeMapper.selectPage(new Page<>(page, size), wrapper);
    }
    
    @Override
    public long getPendingDisputeCount() {
        LambdaQueryWrapper<Dispute> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(Dispute::getStatus, "OPEN", "UNDER_REVIEW", "MEDIATING");
        return disputeMapper.selectCount(wrapper);
    }
    
    // ========== 私有方法 ==========
    
    private String generateDisputeNo() {
        return "DSP" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
    
    private void validateReason(String reason) {
        if (reason == null || reason.isEmpty()) {
            throw new BusinessException("纠纷原因不能为空");
        }
        switch (reason) {
            case REASON_ACCOUNT_NOT_AS_DESCRIBED:
            case REASON_ACCOUNT_RECOVERY:
            case REASON_NOT_RECEIVED:
            case REASON_FRAUD:
            case REASON_OTHER:
                return;
            default:
                throw new BusinessException("无效的纠纷原因: " + reason);
        }
    }
    
    private void validateResolution(String resolution) {
        if (resolution == null || resolution.isEmpty()) {
            throw new BusinessException("解决方式不能为空");
        }
        switch (resolution) {
            case RESOLUTION_FULL_REFUND:
            case RESOLUTION_PARTIAL_REFUND:
            case RESOLUTION_RELEASE_TO_SELLER:
            case RESOLUTION_CANCELLED:
                return;
            default:
                throw new BusinessException("无效的解决方式: " + resolution);
        }
    }
    
    private void handleCreditScoreImpact(Dispute dispute, String resolution) {
        User respondent = userMapper.selectById(dispute.getRespondentId());
        if (respondent == null) return;
        
        int deduction = 0;
        switch (dispute.getReason()) {
            case REASON_ACCOUNT_RECOVERY:
            case REASON_FRAUD:
                deduction = 30;  // 严重违规扣30分
                break;
            case REASON_ACCOUNT_NOT_AS_DESCRIBED:
            case REASON_NOT_RECEIVED:
                deduction = 15;  // 一般违规扣15分
                break;
        }
        
        if (deduction > 0) {
            int newScore = Math.max(0, respondent.getCreditScore() - deduction);
            respondent.setCreditScore(newScore);
            
            // 严重违规直接封号
            if (newScore < 20) {
                respondent.setStatus("BANNED");
            }
            userMapper.updateById(respondent);
            
            log.info("Credit score deducted for user {}: -{} points, new score: {}", 
                    respondent.getId(), deduction, newScore);
        }
    }
}