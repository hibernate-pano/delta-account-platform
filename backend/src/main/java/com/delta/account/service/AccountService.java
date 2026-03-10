package com.delta.account.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.delta.account.model.dto.AccountCreateRequest;
import com.delta.account.model.entity.Account;
import com.delta.account.model.entity.User;

public interface AccountService {
    Page<Account> getAccountList(Integer page, Integer size, String keyword, String sort,
                                  java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice, String gameRank);
    Page<Account> getMyAccounts(User user, Integer page, Integer size);
    Page<Account> getPendingAccounts(Integer page, Integer size);
    Account getAccountDetail(Long id);
    Account createAccount(AccountCreateRequest request, User user);
    Account updateAccount(Long id, AccountCreateRequest request, User user);
    void deleteAccount(Long id, User user);
    void verifyAccount(Long id, String action);
    void toggleStatus(Long id, String status, User user);
}
