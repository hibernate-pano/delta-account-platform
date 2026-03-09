package com.delta.account.controller;

import com.delta.account.common.Result;
import com.delta.account.model.dto.LoginRequest;
import com.delta.account.model.dto.RegisterRequest;
import com.delta.account.model.dto.AuthResponse;
import com.delta.account.model.entity.User;
import com.delta.account.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "认证管理")
public class AuthController {
    
    private final AuthService authService;
    
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
    public Result<User> getProfile(@AuthenticationPrincipal User user) {
        return Result.success(user);
    }
}
