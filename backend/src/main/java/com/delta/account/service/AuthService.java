package com.delta.account.service;

import com.delta.account.model.dto.*;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse register(RegisterRequest request);
}
