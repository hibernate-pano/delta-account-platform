package com.delta.account.controller;

import com.delta.account.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@Tag(name = "健康检查")
public class HealthController {

    @GetMapping
    @Operation(summary = "健康检查")
    public Result<Map<String, Object>> health() {
        Map<String, Object> data = new HashMap<>();
        data.put("status", "UP");
        data.put("timestamp", System.currentTimeMillis());
        data.put("service", "delta-account-platform");
        data.put("version", "1.0.0");
        return Result.success(data);
    }
    
    @GetMapping("/ping")
    @Operation(summary = "简单Ping")
    public Result<String> ping() {
        return Result.success("pong", "pong");
    }
}
