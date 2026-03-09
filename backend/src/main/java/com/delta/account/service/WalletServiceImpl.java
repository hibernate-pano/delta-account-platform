package com.delta.account.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.delta.account.common.BusinessException;
import com.delta.account.mapper.RechargeMapper;
import com.delta.account.mapper.TransactionRecordMapper;
import com.delta.account.mapper.UserMapper;
import com.delta.account.mapper.WithdrawalMapper;
import com.delta.account.model.dto.RechargeRequest;
import com.delta.account.model.dto.WithdrawRequest;
import com.delta.account.model.entity.Recharge;
import com.delta.account.model.entity.TransactionRecord;
import com.delta.account.model.entity.User;
import com.delta.account.model.entity.Withdrawal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {
    
    private final UserMapper userMapper;
    private final TransactionRecordMapper transactionRecordMapper;
    private final RechargeMapper rechargeMapper;
    private final WithdrawalMapper withdrawalMapper;
    
    @Override
    public User getBalance(User user) {
        return userMapper.selectById(user.getId());
    }
    
    @Override
    @Transactional
    public Recharge recharge(User user, RechargeRequest request) {
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("充值金额必须大于0");
        }
        if (request.getAmount().compareTo(new BigDecimal("10000")) > 0) {
            throw new BusinessException("单次充值金额不能超过10000元");
        }
        
        rechargeMapper.insert(recharge);
        
        User dbUser = userMapper.selectById(user.getId());
        BigDecimal balanceBefore = dbUser.getBalance();
        dbUser.setBalance(balanceBefore.add(request.getAmount()));
        userMapper.updateById(dbUser);
        
        TransactionRecord record = new TransactionRecord();
        record.setUserId(user.getId());
        record.setType("RECHARGE");
        record.setAmount(request.getAmount());
        record.setBalanceBefore(balanceBefore);
        record.setBalanceAfter(dbUser.getBalance());
        record.setDescription("充值 " + request.getAmount() + " 元");
        record.setStatus("COMPLETED");
        transactionRecordMapper.insert(record);
        
        return recharge;
    }
    
    @Override
    @Transactional
    public Withdrawal withdraw(User user, WithdrawRequest request) {
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("提现金额必须大于0");
        }
        if (request.getAmount().compareTo(new BigDecimal("10000")) > 0) {
            throw new BusinessException("单次提现金额不能超过10000元");
        }
        if (request.getAmount().compareTo(new BigDecimal("1")) < 0) {
            throw new BusinessException("提现金额不能少于1元");
        }
        
        User dbUser = userMapper.selectById(user.getId());
        if (dbUser.getBalance().compareTo(request.getAmount()) < 0) {
            throw new BusinessException("余额不足");
        }
        
        // Create withdrawal record
        Withdrawal withdrawal = new Withdrawal();
        withdrawal.setUserId(user.getId());
        withdrawal.setAmount(request.getAmount());
        withdrawal.setAccountType(request.getAccountType());
        withdrawal.setAccountNo(request.getAccountNo());
        withdrawal.setAccountName(request.getAccountName());
        withdrawal.setStatus("PENDING");
        withdrawalMapper.insert(withdrawal);
        
        BigDecimal balanceBefore = dbUser.getBalance();
        dbUser.setBalance(balanceBefore.subtract(request.getAmount()));
        userMapper.updateById(dbUser);
        
        TransactionRecord record = new TransactionRecord();
        record.setUserId(user.getId());
        record.setType("WITHDRAW");
        record.setAmount(request.getAmount().negate());
        record.setBalanceBefore(balanceBefore);
        record.setBalanceAfter(dbUser.getBalance());
        record.setDescription("提现 " + request.getAmount() + " 元到 " + request.getAccountType());
        record.setStatus("COMPLETED");
        transactionRecordMapper.insert(record);
        
        return withdrawal;
    }
    
    @Override
    public IPage<TransactionRecord> getTransactionHistory(User user, int page, int size) {
        LambdaQueryWrapper<TransactionRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TransactionRecord::getUserId, user.getId())
               .orderByDesc(TransactionRecord::getCreatedAt);
        return transactionRecordMapper.selectPage(new Page<>(page, size), wrapper);
    }
    
    @Override
    public IPage<Recharge> getRechargeHistory(User user, int page, int size) {
        LambdaQueryWrapper<Recharge> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Recharge::getUserId, user.getId())
               .orderByDesc(Recharge::getCreatedAt);
        return rechargeMapper.selectPage(new Page<>(page, size), wrapper);
    }
    
    @Override
    public IPage<Withdrawal> getWithdrawalHistory(User user, int page, int size) {
        LambdaQueryWrapper<Withdrawal> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Withdrawal::getUserId, user.getId())
               .orderByDesc(Withdrawal::getCreatedAt);
        return withdrawalMapper.selectPage(new Page<>(page, size), wrapper);
    }
    
    @Override
    public List<Recharge> getPendingRecharges() {
        LambdaQueryWrapper<Recharge> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Recharge::getStatus, "PENDING")
               .orderByAsc(Recharge::getCreatedAt);
        return rechargeMapper.selectList(wrapper);
    }
    
    @Override
    public List<Withdrawal> getPendingWithdrawals() {
        LambdaQueryWrapper<Withdrawal> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Withdrawal::getStatus, "PENDING")
               .orderByAsc(Withdrawal::getCreatedAt);
        return withdrawalMapper.selectList(wrapper);
    }
    
    @Override
    @Transactional
    public void processRecharge(Long rechargeId, boolean approved) {
        Recharge recharge = rechargeMapper.selectById(rechargeId);
        if (recharge == null) {
            throw new BusinessException("充值记录不存在");
        }
        
        if (approved) {
            recharge.setStatus("COMPLETED");
        } else {
            recharge.setStatus("FAILED");
        }
        rechargeMapper.updateById(recharge);
    }
    
    @Override
    @Transactional
    public void processWithdrawal(Long withdrawalId, boolean approved, String remark) {
        Withdrawal withdrawal = withdrawalMapper.selectById(withdrawalId);
        if (withdrawal == null) {
            throw new BusinessException("提现记录不存在");
        }
        
        User user = userMapper.selectById(withdrawal.getUserId());
        
        if (approved) {
            withdrawal.setStatus("COMPLETED");
        } else {
            withdrawal.setStatus("REJECTED");
            withdrawal.setRejectReason(remark);
            user.setBalance(user.getBalance().add(withdrawal.getAmount()));
            userMapper.updateById(user);
            
            TransactionRecord record = new TransactionRecord();
            record.setUserId(user.getId());
            record.setType("REFUND");
            record.setAmount(withdrawal.getAmount());
            record.setBalanceBefore(user.getBalance().subtract(withdrawal.getAmount()));
            record.setBalanceAfter(user.getBalance());
            record.setDescription("提现被拒绝，退还金额");
            record.setStatus("COMPLETED");
            transactionRecordMapper.insert(record);
        }
        withdrawalMapper.updateById(withdrawal);
    }
}
