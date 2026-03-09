package com.delta.account.service;

import com.delta.account.model.dto.RechargeRequest;
import com.delta.account.model.dto.WithdrawRequest;
import com.delta.account.model.entity.Recharge;
import com.delta.account.model.entity.TransactionRecord;
import com.delta.account.model.entity.User;
import com.delta.account.model.entity.Withdrawal;
import com.baomidou.mybatisplus.core.metadata.IPage;
import java.util.List;

public interface WalletService {
    
    User getBalance(User user);
    
    Recharge recharge(User user, RechargeRequest request);
    
    Withdrawal withdraw(User user, WithdrawRequest request);
    
    IPage<TransactionRecord> getTransactionHistory(User user, int page, int size);
    
    IPage<Recharge> getRechargeHistory(User user, int page, int size);
    
    IPage<Withdrawal> getWithdrawalHistory(User user, int page, int size);
    
    List<Recharge> getPendingRecharges();
    
    List<Withdrawal> getPendingWithdrawals();
    
    void processRecharge(Long rechargeId, boolean approved);
    
    void processWithdrawal(Long withdrawalId, boolean approved, String remark);
}
