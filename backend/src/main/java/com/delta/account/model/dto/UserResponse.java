package com.delta.account.model.dto;

import com.delta.account.model.entity.User;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UserResponse {
    private Long id;
    private String username;
    private String nickname;
    private String avatar;
    private String phone;
    private String email;
    private BigDecimal balance;
    private Integer creditScore;
    private String role;
    private String status;

    public static UserResponse from(User user) {
        if (user == null) return null;
        UserResponse resp = new UserResponse();
        resp.setId(user.getId());
        resp.setUsername(user.getUsername());
        resp.setNickname(user.getNickname());
        resp.setAvatar(user.getAvatar());
        resp.setPhone(user.getPhone());
        resp.setEmail(user.getEmail());
        resp.setBalance(user.getBalance());
        resp.setCreditScore(user.getCreditScore());
        resp.setRole(user.getRole());
        resp.setStatus(user.getStatus());
        return resp;
    }
}
