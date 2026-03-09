package com.delta.account.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.delta.account.common.Result;
import com.delta.account.mapper.UserMapper;
import com.delta.account.model.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "管理接口")
@RequiredArgsConstructor
public class AdminController {

    private final UserMapper userMapper;

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "获取用户列表")
    public Result<Page<User>> getUsers(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        Page<User> userPage = new Page<>(page, size);
        return Result.success(userMapper.selectPage(userPage, null));
    }
    
    @PutMapping("/users/{id}/ban")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "封禁用户")
    public Result<Void> banUser(@PathVariable Long id) {
        User user = userMapper.selectById(id);
        if (user == null) {
            return Result.error(404, "用户不存在");
        }
        user.setStatus("BANNED");
        userMapper.updateById(user);
        return Result.success();
    }
    
    @PutMapping("/users/{id}/unban")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "解封用户")
    public Result<Void> unbanUser(@PathVariable Long id) {
        User user = userMapper.selectById(id);
        if (user == null) {
            return Result.error(404, "用户不存在");
        }
        user.setStatus("ACTIVE");
        userMapper.updateById(user);
        return Result.success();
    }
}
