package com.delta.account.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProfileUpdateRequest {
    @Size(max = 30, message = "昵称最长30字符")
    private String nickname;

    @Email(message = "邮箱格式不正确")
    @Size(max = 50, message = "邮箱最长50字符")
    private String email;

    @Size(max = 20, message = "手机号最长20字符")
    private String phone;

    @Size(max = 500, message = "头像URL最长500字符")
    private String avatar;
}
