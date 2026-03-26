package com.delta.account.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.delta.account.common.Result;
import com.delta.account.model.dto.AccountCreateRequest;
import com.delta.account.model.entity.Account;
import com.delta.account.model.entity.User;
import com.delta.account.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@Tag(name = "账号管理")
public class AccountController {

    private final AccountService accountService;

    @GetMapping
    @Operation(summary = "获取账号列表")
    public Result<Page<Account>> getAccountList(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "created_at") String sort,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String gameRank) {
        size = Math.min(size, 50);
        return Result.success(accountService.getAccountList(page, size, keyword, sort, minPrice, maxPrice, gameRank));
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "获取账号详情")
    public Result<Account> getAccountDetail(@PathVariable Long id) {
        return Result.success(accountService.getAccountDetail(id));
    }

    @GetMapping("/my")
    @Operation(summary = "获取我的账号")
    public Result<Page<Account>> getMyAccounts(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        size = Math.min(size, 100);
        return Result.success(accountService.getMyAccounts(user, page, size));
    }
    
    @PostMapping
    @Operation(summary = "发布账号")
    public Result<Account> createAccount(
            @Valid @RequestBody AccountCreateRequest request,
            @AuthenticationPrincipal User user) {
        return Result.success("发布成功，等待审核", accountService.createAccount(request, user));
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "更新账号信息")
    public Result<Account> updateAccount(
            @PathVariable Long id,
            @Valid @RequestBody AccountCreateRequest request,
            @AuthenticationPrincipal User user) {
        return Result.success(accountService.updateAccount(id, request, user));
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "下架账号")
    public Result<Void> deleteAccount(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        accountService.deleteAccount(id, user);
        return Result.success();
    }

    @PutMapping("/{id}/toggle")
    @Operation(summary = "上架/下架切换")
    public Result<Void> toggleStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @AuthenticationPrincipal User user) {
        accountService.toggleStatus(id, status, user);
        return Result.success();
    }
}
