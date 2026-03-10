package com.delta.account.service;

import com.delta.account.config.MembershipConfig;
import com.delta.account.mapper.UserMapper;
import com.delta.account.model.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class MembershipService {

    private final UserMapper userMapper;
    private final MembershipConfig membershipConfig;

    /**
     * 用户消费后增加经验值和积分
     */
    @Transactional
    public void onPurchase(User user, int amount) {
        // 增加经验值 (1元 = 1经验)
        int newExperience = (user.getExperience() == null ? 0 : user.getExperience()) + amount;
        // 增加积分 (1元 = 1积分 * 等级倍率)
        MembershipConfig.LevelConfig levelConfig = membershipConfig.getLevelConfig(user.getLevel() != null ? user.getLevel() : 1);
        int pointsRate = levelConfig != null ? levelConfig.getPointsRate() : 1;
        int newPoints = (user.getPoints() == null ? 0 : user.getPoints()) + (amount * pointsRate);
        // 增加累计消费
        int newTotalSpent = (user.getTotalSpent() == null ? 0 : user.getTotalSpent()) + amount;

        // 计算新等级
        int newLevel = membershipConfig.getLevelByExperience(newExperience);

        // 更新用户
        User updateUser = new User();
        updateUser.setId(user.getId());
        updateUser.setExperience(newExperience);
        updateUser.setPoints(newPoints);
        updateUser.setTotalSpent(newTotalSpent);
        if (newLevel != user.getLevel()) {
            updateUser.setLevel(newLevel);
            log.info("用户 {} 升级到等级 {}", user.getId(), newLevel);
        }
        userMapper.updateById(updateUser);
    }

    /**
     * 用户收入后增加积分
     */
    @Transactional
    public void onEarnings(User user, int amount) {
        // 卖家获得积分 (1元 = 0.5积分)
        MembershipConfig.LevelConfig levelConfig = membershipConfig.getLevelConfig(user.getLevel() != null ? user.getLevel() : 1);
        int pointsRate = levelConfig != null ? levelConfig.getPointsRate() : 1;
        int newPoints = (user.getPoints() == null ? 0 : user.getPoints()) + (amount * pointsRate / 2);
        // 增加累计收入
        int newTotalEarnings = (user.getTotalEarnings() == null ? 0 : user.getTotalEarnings()) + amount;

        User updateUser = new User();
        updateUser.setId(user.getId());
        updateUser.setPoints(newPoints);
        updateUser.setTotalEarnings(newTotalEarnings);
        userMapper.updateById(updateUser);
    }

    /**
     * 消耗积分
     */
    @Transactional
    public boolean consumePoints(User user, int points) {
        if (user.getPoints() == null || user.getPoints() < points) {
            return false;
        }

        User updateUser = new User();
        updateUser.setId(user.getId());
        updateUser.setPoints(user.getPoints() - points);
        userMapper.updateById(updateUser);
        return true;
    }

    /**
     * 获取用户等级信息
     */
    public UserLevelInfo getUserLevelInfo(User user) {
        int level = user.getLevel() != null ? user.getLevel() : 1;
        int experience = user.getExperience() != null ? user.getExperience() : 0;
        int points = user.getPoints() != null ? user.getPoints() : 0;

        MembershipConfig.LevelConfig currentConfig = membershipConfig.getLevelConfig(level);
        MembershipConfig.LevelConfig nextConfig = membershipConfig.getLevelConfig(level + 1);

        int experienceToNext = 0;
        if (nextConfig != null) {
            experienceToNext = nextConfig.getMinExperience() - experience;
        }

        return new UserLevelInfo(
                level,
                currentConfig != null ? currentConfig.getName() : "普通会员",
                currentConfig != null ? currentConfig.getTitle() : "",
                experience,
                points,
                currentConfig != null ? currentConfig.getDiscount() : 1.0,
                currentConfig != null ? currentConfig.getPointsRate() : 1,
                currentConfig != null ? currentConfig.isPrioritySupport() : false,
                currentConfig != null ? currentConfig.isFreeWithdrawal() : false,
                experienceToNext,
                nextConfig != null ? nextConfig.getTitle() : null
        );
    }

    /**
     * 用户等级信息
     */
    @lombok.Data
    public static class UserLevelInfo {
        private int level;
        private String name;
        private String title;
        private int experience;
        private int points;
        private double discount;
        private int pointsRate;
        private boolean prioritySupport;
        private boolean freeWithdrawal;
        private int experienceToNext;
        private String nextLevelName;

        public UserLevelInfo(int level, String name, String title, int experience, int points,
                           double discount, int pointsRate, boolean prioritySupport, boolean freeWithdrawal,
                           int experienceToNext, String nextLevelName) {
            this.level = level;
            this.name = name;
            this.title = title;
            this.experience = experience;
            this.points = points;
            this.discount = discount;
            this.pointsRate = pointsRate;
            this.prioritySupport = prioritySupport;
            this.freeWithdrawal = freeWithdrawal;
            this.experienceToNext = experienceToNext;
            this.nextLevelName = nextLevelName;
        }
    }
}
