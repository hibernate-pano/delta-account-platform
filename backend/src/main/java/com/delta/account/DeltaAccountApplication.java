package com.delta.account;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.delta.account.mapper")
public class DeltaAccountApplication {
    public static void main(String[] args) {
        SpringApplication.run(DeltaAccountApplication.class, args);
    }
}
