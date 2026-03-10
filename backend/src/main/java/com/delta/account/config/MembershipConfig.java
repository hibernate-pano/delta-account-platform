package com.delta.account.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Data
@Component
@ConfigurationProperties(prefix = "membership")
public class MembershipConfig {

    private List<LevelConfig> levels;

    @Data
    public static class LevelConfig {
        private int level;
        private String name;
        private String title;
        private int minExperience;
        private double discount;         // 购物折扣
        private int pointsRate;          // 积分倍率
        private boolean prioritySupport;  // 优先客服
        private boolean freeWithdrawal;  // 免费提现
    }

    public LevelConfig getLevelConfig(int level) {
        if (levels == null) return null;
        return levels.stream()
                .filter(l -> l.getLevel() == level)
                .findFirst()
                .orElse(null);
    }

    public int getLevelByExperience(int experience) {
        if (levels == null) return 1;
        int level = 1;
        for (LevelConfig config : levels) {
            if (experience >= config.getMinExperience()) {
                level = config.getLevel();
            } else {
                break;
            }
        }
        return level;
    }
}
