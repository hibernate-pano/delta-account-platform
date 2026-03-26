package com.delta.account.controller;

import com.delta.account.common.BusinessException;
import com.delta.account.common.Result;
import com.delta.account.mapper.UserMapper;
import com.delta.account.model.dto.*;
import com.delta.account.model.entity.User;
import com.delta.account.service.AuthService;
import com.delta.account.service.MembershipService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "认证管理")
public class AuthController {

    private final AuthService authService;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final MembershipService membershipService;

    @PostMapping("/register")
    @Operation(summary = "用户注册")
    public Result<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return Result.success(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "用户登录")
    public Result<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return Result.success(authService.login(request));
    }

    @GetMapping("/profile")
    @Operation(summary = "获取当前用户信息")
    public Result<UserResponse> getProfile(@AuthenticationPrincipal User user) {
        User dbUser = userMapper.selectById(user.getId());
        return Result.success(UserResponse.from(dbUser));
    }

    @PutMapping("/profile")
    @Operation(summary = "更新用户资料")
    public Result<UserResponse> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ProfileUpdateRequest request) {
        User dbUser = userMapper.selectById(user.getId());
        if (request.getNickname() != null) {
            dbUser.setNickname(request.getNickname());
        }
        if (request.getEmail() != null) {
            dbUser.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) {
            dbUser.setPhone(request.getPhone());
        }
        if (request.getAvatar() != null) {
            dbUser.setAvatar(request.getAvatar());
        }
        userMapper.updateById(dbUser);
        return Result.success(UserResponse.from(dbUser));
    }

    @PutMapping("/password")
    @Operation(summary = "修改密码")
    public Result<Void> changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ChangePasswordRequest request) {
        User dbUser = userMapper.selectById(user.getId());
        if (!passwordEncoder.matches(request.getOldPassword(), dbUser.getPassword())) {
            throw new BusinessException("旧密码错误");
        }
        if (request.getOldPassword().equals(request.getNewPassword())) {
            throw new BusinessException("新密码不能与旧密码相同");
        }
        dbUser.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userMapper.updateById(dbUser);
        return Result.success("密码修改成功", (Void) null);
    }

    @GetMapping("/membership")
    @Operation(summary = "获取会员等级信息")
    public Result<MembershipService.UserLevelInfo> getMembershipInfo(@AuthenticationPrincipal User user) {
        User dbUser = userMapper.selectById(user.getId());
        MembershipService.UserLevelInfo levelInfo = membershipService.getUserLevelInfo(dbUser);
        return Result.success(levelInfo);
    }
}
