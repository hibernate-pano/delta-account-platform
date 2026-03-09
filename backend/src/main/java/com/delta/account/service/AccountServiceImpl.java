package com.delta.account.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.delta.account.common.BusinessException;
import com.delta.account.mapper.AccountMapper;
import com.delta.account.mapper.UserMapper;
import com.delta.account.model.dto.AccountCreateRequest;
import com.delta.account.model.entity.Account;
import com.delta.account.model.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {
    
    private final AccountMapper accountMapper;
    private final UserMapper userMapper;
    
    @Override
    public Page<Account> getAccountList(Integer page, Integer size, String keyword, String status, String sort) {
        Page<Account> pageParam = new Page<>(page, size);
        
        QueryWrapper<Account> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("status", "ON_SALE");
        
        if (StringUtils.hasText(keyword)) {
            queryWrapper.and(w -> w
                    .like("title", keyword)
                    .or()
                    .like("description", keyword)
                    .or()
                    .like("game_rank", keyword));
        }
        
        // 排序
        if ("price_asc".equals(sort)) {
            queryWrapper.orderByAsc("price");
        } else if ("price_desc".equals(sort)) {
            queryWrapper.orderByDesc("price");
        } else if ("skin_count".equals(sort)) {
            queryWrapper.orderByDesc("skin_count");
        } else {
            queryWrapper.orderByDesc("created_at");
        }
        
        // 关联卖家信息
        queryWrapper.apply("seller_id = users.id");
        
        return accountMapper.selectPage(pageParam, queryWrapper);
    }
    
    @Override
    public Account getAccountDetail(Long id) {
        Account account = accountMapper.selectAccountWithSeller(id);
        if (account == null) {
            throw new BusinessException("账号不存在");
        }
        return account;
    }
    
    @Override
    public Account createAccount(AccountCreateRequest request, User user) {
        Account account = new Account();
        account.setSellerId(user.getId());
        account.setTitle(request.getTitle());
        account.setGameRank(request.getGameRank());
        account.setSkinCount(request.getSkinCount() != null ? request.getSkinCount() : 0);
        account.setWeapons(request.getWeapons());
        account.setPrice(request.getPrice());
        account.setRentalPrice(request.getRentalPrice());
        account.setDescription(request.getDescription());
        account.setImages(request.getImages());
        account.setStatus("PENDING");
        account.setVerificationStatus("UNVERIFIED");
        
        accountMapper.insert(account);
        return account;
    }
    
    @Override
    public Account updateAccount(Long id, AccountCreateRequest request, User user) {
        Account account = accountMapper.selectById(id);
        if (account == null) {
            throw new BusinessException("账号不存在");
        }
        
        if (!account.getSellerId().equals(user.getId()) && !"ADMIN".equals(user.getRole())) {
            throw new BusinessException("无权限操作");
        }
        
        account.setTitle(request.getTitle());
        account.setGameRank(request.getGameRank());
        account.setSkinCount(request.getSkinCount());
        account.setWeapons(request.getWeapons());
        account.setPrice(request.getPrice());
        account.setRentalPrice(request.getRentalPrice());
        account.setDescription(request.getDescription());
        account.setImages(request.getImages());
        
        accountMapper.updateById(account);
        return account;
    }
    
    @Override
    public void deleteAccount(Long id, User user) {
        Account account = accountMapper.selectById(id);
        if (account == null) {
            throw new BusinessException("账号不存在");
        }
        
        if (!account.getSellerId().equals(user.getId()) && !"ADMIN".equals(user.getRole())) {
            throw new BusinessException("无权限操作");
        }
        
        account.setStatus("OFFLINE");
        accountMapper.updateById(account);
    }
}
