package com.delta.account.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.delta.account.mapper.CouponMapper;
import com.delta.account.mapper.UserCouponMapper;
import com.delta.account.model.entity.Coupon;
import com.delta.account.model.entity.User;
import com.delta.account.model.entity.UserCoupon;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponMapper couponMapper;
    private final UserCouponMapper userCouponMapper;

    /**
     * 领取优惠券
     */
    @Transactional
    public void claimCoupon(User user, Long couponId) {
        Coupon coupon = couponMapper.selectById(couponId);
        if (coupon == null) {
            throw new com.delta.account.common.BusinessException("优惠券不存在");
        }

        if (!"ACTIVE".equals(coupon.getStatus())) {
            throw new com.delta.account.common.BusinessException("优惠券不可用");
        }

        // 检查有效期
        LocalDateTime now = LocalDateTime.now();
        if (coupon.getValidFrom() != null && now.isBefore(coupon.getValidFrom())) {
            throw new com.delta.account.common.BusinessException("优惠券尚未生效");
        }
        if (coupon.getValidUntil() != null && now.isAfter(coupon.getValidUntil())) {
            throw new com.delta.account.common.BusinessException("优惠券已过期");
        }

        // 检查每人限领
        if (coupon.getPerUserLimit() != null && coupon.getPerUserLimit() > 0) {
            QueryWrapper<UserCoupon> userCouponQuery = new QueryWrapper<>();
            userCouponQuery.eq("user_id", user.getId());
            userCouponQuery.eq("coupon_id", couponId);
            long count = userCouponMapper.selectCount(userCouponQuery);
            if (count >= coupon.getPerUserLimit()) {
                throw new com.delta.account.common.BusinessException("您已领取过该优惠券");
            }
        }

        // 检查库存
        if (coupon.getTotalCount() != null) {
            int available = coupon.getTotalCount() - (coupon.getUsedCount() != null ? coupon.getUsedCount() : 0);
            if (available <= 0) {
                throw new com.delta.account.common.BusinessException("优惠券已领完");
            }
        }

        // 发放优惠券
        UserCoupon userCoupon = new UserCoupon();
        userCoupon.setUserId(user.getId());
        userCoupon.setCouponId(couponId);
        userCoupon.setStatus("UNUSED");
        userCouponMapper.insert(userCoupon);

        // 更新已发放数量
        coupon.setUsedCount((coupon.getUsedCount() != null ? coupon.getUsedCount() : 0) + 1);
        couponMapper.updateById(coupon);

        log.info("用户 {} 领取优惠券 {}", user.getId(), couponId);
    }

    /**
     * 使用优惠券码兑换
     */
    @Transactional
    public void claimByCode(User user, String code) {
        QueryWrapper<Coupon> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("code", code.toUpperCase());
        Coupon coupon = couponMapper.selectOne(queryWrapper);

        if (coupon == null) {
            throw new com.delta.account.common.BusinessException("优惠券码无效");
        }

        claimCoupon(user, coupon.getId());
    }

    /**
     * 获取用户可用优惠券
     */
    public List<Coupon> getUserAvailableCoupons(User user) {
        QueryWrapper<UserCoupon> userCouponQuery = new QueryWrapper<>();
        userCouponQuery.eq("user_id", user.getId());
        userCouponQuery.eq("status", "UNUSED");
        List<UserCoupon> userCoupons = userCouponMapper.selectList(userCouponQuery);

        if (userCoupons.isEmpty()) {
            return List.of();
        }

        LocalDateTime now = LocalDateTime.now();
        return userCoupons.stream()
                .map(uc -> couponMapper.selectById(uc.getCouponId()))
                .filter(c -> c != null && "ACTIVE".equals(c.getStatus()))
                .filter(c -> c.getValidFrom() == null || !now.isBefore(c.getValidFrom()))
                .filter(c -> c.getValidUntil() == null || !now.isAfter(c.getValidUntil()))
                .toList();
    }

    /**
     * 计算订单优惠
     */
    public BigDecimal calculateDiscount(BigDecimal orderAmount, Coupon coupon) {
        if (coupon == null) {
            return BigDecimal.ZERO;
        }

        // 检查最低消费
        if (coupon.getMinAmount() != null && orderAmount.compareTo(coupon.getMinAmount()) < 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal discount = BigDecimal.ZERO;
        if ("DISCOUNT".equals(coupon.getType())) {
            // 折扣: 如 0.9 表示9折
            discount = orderAmount.multiply(BigDecimal.ONE.subtract(coupon.getValue()));
        } else if ("CASH".equals(coupon.getType())) {
            // 现金减免
            discount = coupon.getValue();
        }

        // 优惠不超过订单金额
        if (discount.compareTo(orderAmount) > 0) {
            discount = orderAmount;
        }

        return discount.setScale(2, BigDecimal.ROUND_HALF_UP);
    }

    /**
     * 使用优惠券
     */
    @Transactional
    public void useCoupon(Long userCouponId, User user) {
        UserCoupon userCoupon = userCouponMapper.selectById(userCouponId);
        if (userCoupon == null) {
            throw new com.delta.account.common.BusinessException("用户优惠券不存在");
        }

        if (!userCoupon.getUserId().equals(user.getId())) {
            throw new com.delta.account.common.BusinessException("无权限使用");
        }

        if (!"UNUSED".equals(userCoupon.getStatus())) {
            throw new com.delta.account.common.BusinessException("优惠券已使用或已过期");
        }

        userCoupon.setStatus("USED");
        userCoupon.setUsedAt(LocalDateTime.now());
        userCouponMapper.updateById(userCoupon);

        log.info("用户 {} 使用优惠券 {}", user.getId(), userCouponId);
    }

    /**
     * 管理员获取优惠券列表
     */
    public List<Coupon> getAllCoupons() {
        return couponMapper.selectList(
                new QueryWrapper<Coupon>().orderByDesc("created_at")
        );
    }
}
