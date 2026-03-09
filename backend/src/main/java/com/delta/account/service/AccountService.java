package com.delta.account.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.delta.account.model.dto.AccountCreateRequest;
import com.delta.account.model.entity.Account;
import com.delta.account.model.entity.User;

public interface AccountService {
    Page<Account> getAccountList(Integer page, Integer size, String keyword, String status, String sort);
    Account getAccountDetail(Long id);
    Account createAccount(AccountCreateRequest request, User user);
    Account updateAccount(Long id, AccountCreateRequest request, User user);
    void deleteAccount(Long id, User user);
}
