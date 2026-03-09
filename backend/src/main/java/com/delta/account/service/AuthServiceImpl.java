package com.delta.account.service;

import com.delta.account.common.BusinessException;
import com.delta.account.config.JwtUtil;
import com.delta.account.mapper.UserMapper;
import com.delta.account.model.dto.*;
import com.delta.account.model.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    
    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<User>()
                        .eq("username", request.getUsername())
        );
        
        if (user == null) {
            throw new BusinessException("用户名或密码错误");
        }
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException("用户名或密码错误");
        }
        
        if (!"ACTIVE".equals(user.getStatus())) {
            throw new BusinessException("账号已被封禁");
        }
        
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());
        
        return new AuthResponse(token, "Bearer", user.getId(), user.getUsername(), user.getRole());
    }
    
    @Override
    public AuthResponse register(RegisterRequest request) {
        // 检查用户名是否存在
        Long count = userMapper.selectCount(
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<User>()
                        .eq("username", request.getUsername())
        );
        
        if (count > 0) {
            throw new BusinessException("用户名已存在");
        }
        
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setEmail(request.getEmail());
        user.setNickname(request.getNickname() != null ? request.getNickname() : request.getUsername());
        user.setBalance(BigDecimal.ZERO);
        user.setCreditScore(100);
        user.setRole("USER");
        user.setStatus("ACTIVE");
        
        userMapper.insert(user);
        
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());
        
        return new AuthResponse(token, "Bearer", user.getId(), user.getUsername(), user.getRole());
    }
}
