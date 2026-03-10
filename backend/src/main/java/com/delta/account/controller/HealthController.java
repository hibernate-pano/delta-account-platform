package com.delta.account.controller;

import com.delta.account.common.Result;
import com.zaxxer.hikari.HikariDataSource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@Tag(name = "健康检查")
public class HealthController {

    @Autowired
    private DataSource dataSource;

    @GetMapping
    @Operation(summary = "健康检查")
    public Result<Map<String, Object>> health() {
        Map<String, Object> data = new HashMap<>();
        data.put("status", "UP");
        data.put("timestamp", LocalDateTime.now().toString());
        data.put("service", "delta-account-platform");
        data.put("version", "1.0.0");

        // Database health
        Map<String, Object> db = new HashMap<>();
        try (Connection conn = dataSource.getConnection()) {
            db.put("status", "UP");
            db.put("database", conn.getCatalog());
            if (dataSource instanceof HikariDataSource) {
                HikariDataSource hikari = (HikariDataSource) dataSource;
                db.put("poolActive", hikari.getHikariPoolMXBean().getActiveConnections());
                db.put("poolIdle", hikari.getHikariPoolMXBean().getIdleConnections());
            }
        } catch (Exception e) {
            db.put("status", "DOWN");
            db.put("error", e.getMessage());
            data.put("status", "DEGRADED");
        }
        data.put("database", db);

        return Result.success(data);
    }

    @GetMapping("/ping")
    @Operation(summary = "简单Ping")
    public Result<String> ping() {
        return Result.success("pong", "pong");
    }
}
