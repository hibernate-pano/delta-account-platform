package com.delta.account.controller;

import com.delta.account.common.Result;
import com.delta.account.model.dto.RechargeRequest;
import com.delta.account.model.dto.WithdrawRequest;
import com.delta.account.model.entity.Recharge;
import com.delta.account.model.entity.TransactionRecord;
import com.delta.account.model.entity.User;
import com.delta.account.model.entity.Withdrawal;
import com.delta.account.service.WalletService;
import com.baomidou.mybatisplus.core.metadata.IPage;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
@Tag(name = "钱包管理")
public class WalletController {
    
    private final WalletService walletService;
    
    @GetMapping("/balance")
    @Operation(summary = "获取余额")
    public Result<User> getBalance(@AuthenticationPrincipal User user) {
        return Result.success("获取成功", walletService.getBalance(user));
    }
    
    @PostMapping("/recharge")
    @Operation(summary = "充值")
    public Result<Recharge> recharge(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody RechargeRequest request) {
        return Result.success("充值成功", walletService.recharge(user, request));
    }
    
    @PostMapping("/withdraw")
    @Operation(summary = "提现")
    public Result<Withdrawal> withdraw(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody WithdrawRequest request) {
        return Result.success("提现申请已提交", walletService.withdraw(user, request));
    }
    
    @GetMapping("/transactions")
    @Operation(summary = "流水记录")
    public Result<IPage<TransactionRecord>> getTransactionHistory(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return Result.success("获取成功", walletService.getTransactionHistory(user, page, size));
    }
    
    @GetMapping("/recharges")
    @Operation(summary = "充值记录")
    public Result<IPage<Recharge>> getRechargeHistory(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return Result.success("获取成功", walletService.getRechargeHistory(user, page, size));
    }
    
    @GetMapping("/withdrawals")
    @Operation(summary = "提现记录")
    public Result<IPage<Withdrawal>> getWithdrawalHistory(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return Result.success("获取成功", walletService.getWithdrawalHistory(user, page, size));
    }
}
