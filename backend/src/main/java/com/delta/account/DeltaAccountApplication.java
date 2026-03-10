package com.delta.account;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@MapperScan("com.delta.account.mapper")
@EnableAsync
@EnableScheduling
public class DeltaAccountApplication {
    public static void main(String[] args) {
        SpringApplication.run(DeltaAccountApplication.class, args);
    }
}
