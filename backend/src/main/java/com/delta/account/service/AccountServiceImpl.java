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

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {

    private final AccountMapper accountMapper;
    private final UserMapper userMapper;
    private final NotificationService notificationService;

    @Override
    public Page<Account> getAccountList(Integer page, Integer size, String keyword, String sort,
                                         BigDecimal minPrice, BigDecimal maxPrice, String gameRank) {
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

        if (minPrice != null) {
            queryWrapper.ge("price", minPrice);
        }
        if (maxPrice != null) {
            queryWrapper.le("price", maxPrice);
        }
        if (StringUtils.hasText(gameRank)) {
            queryWrapper.eq("game_rank", gameRank);
        }

        if ("price_asc".equals(sort)) {
            queryWrapper.orderByAsc("price");
        } else if ("price_desc".equals(sort)) {
            queryWrapper.orderByDesc("price");
        } else if ("skin_count".equals(sort)) {
            queryWrapper.orderByDesc("skin_count");
        } else {
            queryWrapper.orderByDesc("created_at");
        }

        Page<Account> result = accountMapper.selectPage(pageParam, queryWrapper);
        enrichSellerInfo(result);
        return result;
    }

    @Override
    public Page<Account> getMyAccounts(User user, Integer page, Integer size) {
        Page<Account> pageParam = new Page<>(page, size);
        QueryWrapper<Account> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("seller_id", user.getId())
                .orderByDesc("created_at");
        return accountMapper.selectPage(pageParam, queryWrapper);
    }

    @Override
    public Page<Account> getPendingAccounts(Integer page, Integer size) {
        Page<Account> pageParam = new Page<>(page, size);
        QueryWrapper<Account> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("verification_status", "UNVERIFIED")
                .orderByAsc("created_at");
        Page<Account> result = accountMapper.selectPage(pageParam, queryWrapper);
        enrichSellerInfo(result);
        return result;
    }

    @Override
    public void verifyAccount(Long id, String action) {
        Account account = accountMapper.selectById(id);
        if (account == null) {
            throw new BusinessException("账号不存在");
        }
        if ("approve".equals(action)) {
            account.setVerificationStatus("VERIFIED");
            account.setStatus("ON_SALE");
            notificationService.notifyAccountVerified(account.getSellerId(), account.getId());
        } else {
            account.setVerificationStatus("REJECTED");
            account.setStatus("OFFLINE");
            notificationService.sendNotification(
                    account.getSellerId(), "ACCOUNT_REJECTED", "账号审核未通过",
                    "您发布的账号 \"" + account.getTitle() + "\" 未通过审核",
                    String.valueOf(account.getId()));
        }
        accountMapper.updateById(account);
    }

    private void enrichSellerInfo(Page<Account> result) {
        List<Account> records = result.getRecords();
        if (!records.isEmpty()) {
            Set<Long> sellerIds = records.stream()
                    .map(Account::getSellerId)
                    .collect(Collectors.toSet());
            List<User> sellers = userMapper.selectBatchIds(sellerIds);
            Map<Long, User> sellerMap = sellers.stream()
                    .collect(Collectors.toMap(User::getId, u -> u));
            records.forEach(account -> {
                User seller = sellerMap.get(account.getSellerId());
                if (seller != null) {
                    account.setSellerUsername(seller.getUsername());
                    account.setSellerNickname(seller.getNickname());
                    account.setSellerAvatar(seller.getAvatar());
                }
            });
        }
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

        // 修改后需要重新审核
        account.setVerificationStatus("UNVERIFIED");
        // 如果正在售卖，下架等待审核
        if ("ON_SALE".equals(account.getStatus())) {
            account.setStatus("OFFLINE");
        }

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

    @Override
    public void toggleStatus(Long id, String status, User user) {
        Account account = accountMapper.selectById(id);
        if (account == null) {
            throw new BusinessException("账号不存在");
        }
        if (!account.getSellerId().equals(user.getId()) && !"ADMIN".equals(user.getRole())) {
            throw new BusinessException("无权限操作");
        }
        // 只允许在 ON_SALE 和 OFFLINE 之间切换
        if ("ON_SALE".equals(status) && "OFFLINE".equals(account.getStatus())) {
            // 上架要求已通过审核
            if (!"VERIFIED".equals(account.getVerificationStatus())) {
                throw new BusinessException("账号未通过审核，无法上架");
            }
            account.setStatus("ON_SALE");
        } else if ("OFFLINE".equals(status) && "ON_SALE".equals(account.getStatus())) {
            account.setStatus("OFFLINE");
        } else {
            throw new BusinessException("当前状态不允许此操作");
        }
        accountMapper.updateById(account);
    }
}
