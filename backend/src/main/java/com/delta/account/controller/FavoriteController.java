package com.delta.account.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.delta.account.common.Result;
import com.delta.account.mapper.AccountMapper;
import com.delta.account.mapper.FavoriteMapper;
import com.delta.account.model.entity.Account;
import com.delta.account.model.entity.Favorite;
import com.delta.account.model.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/favorites")
@Tag(name = "收藏管理")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteMapper favoriteMapper;
    private final AccountMapper accountMapper;

    @PostMapping("/{accountId}")
    @Operation(summary = "切换收藏状态")
    public Result<Boolean> toggleFavorite(
            @PathVariable Long accountId,
            @AuthenticationPrincipal User user) {
        QueryWrapper<Favorite> query = new QueryWrapper<>();
        query.eq("user_id", user.getId()).eq("account_id", accountId);
        Favorite existing = favoriteMapper.selectOne(query);

        if (existing != null) {
            favoriteMapper.deleteById(existing.getId());
            return Result.success("已取消收藏", false);
        } else {
            Favorite favorite = new Favorite();
            favorite.setUserId(user.getId());
            favorite.setAccountId(accountId);
            favoriteMapper.insert(favorite);
            return Result.success("已收藏", true);
        }
    }

    @GetMapping
    @Operation(summary = "获取我的收藏列表")
    public Result<List<Account>> getMyFavorites(@AuthenticationPrincipal User user) {
        List<Favorite> favorites = favoriteMapper.selectList(
                new QueryWrapper<Favorite>()
                        .eq("user_id", user.getId())
                        .orderByDesc("created_at")
        );

        if (favorites.isEmpty()) {
            return Result.success(List.of());
        }

        List<Long> accountIds = favorites.stream()
                .map(Favorite::getAccountId)
                .collect(Collectors.toList());
        List<Account> accounts = accountMapper.selectBatchIds(accountIds);
        return Result.success(accounts);
    }

    @GetMapping("/ids")
    @Operation(summary = "获取我的收藏ID列表")
    public Result<List<Long>> getMyFavoriteIds(@AuthenticationPrincipal User user) {
        List<Favorite> favorites = favoriteMapper.selectList(
                new QueryWrapper<Favorite>()
                        .select("account_id")
                        .eq("user_id", user.getId())
        );
        List<Long> ids = favorites.stream()
                .map(Favorite::getAccountId)
                .collect(Collectors.toList());
        return Result.success(ids);
    }
}
