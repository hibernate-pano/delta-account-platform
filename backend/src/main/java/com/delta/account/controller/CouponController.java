package com.delta.account.controller;

import com.delta.account.common.Result;
import com.delta.account.model.entity.Coupon;
import com.delta.account.model.entity.User;
import com.delta.account.service.CouponService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
@Tag(name = "优惠券管理")
public class CouponController {

    private final CouponService couponService;

    @PostMapping("/claim/{id}")
    @Operation(summary = "领取优惠券")
    public Result<Void> claimCoupon(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        couponService.claimCoupon(user, id);
        return Result.success();
    }

    @PostMapping("/claim")
    @Operation(summary = "使用优惠券码兑换")
    public Result<Void> claimByCode(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal User user) {
        couponService.claimByCode(user, request.get("code"));
        return Result.success();
    }

    @GetMapping("/available")
    @Operation(summary = "获取我的可用优惠券")
    public Result<List<Coupon>> getAvailableCoupons(@AuthenticationPrincipal User user) {
        return Result.success(couponService.getUserAvailableCoupons(user));
    }

    @PostMapping("/calculate")
    @Operation(summary = "计算优惠金额")
    public Result<Map<String, BigDecimal>> calculateDiscount(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal User user) {
        BigDecimal orderAmount = new BigDecimal(request.get("orderAmount").toString());
        Long couponId = Long.parseLong(request.get("couponId").toString());

        Coupon coupon = couponService.getUserAvailableCoupons(user).stream()
                .filter(c -> c.getId().equals(couponId))
                .findFirst()
                .orElse(null);

        if (coupon == null) {
            return Result.error("优惠券不可用");
        }

        BigDecimal discount = couponService.calculateDiscount(orderAmount, coupon);
        return Result.success(Map.of(
                "discount", discount,
                "finalAmount", orderAmount.subtract(discount)
        ));
    }

    @PostMapping("/use/{id}")
    @Operation(summary = "使用优惠券")
    public Result<Void> useCoupon(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        couponService.useCoupon(id, user);
        return Result.success();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "获取所有优惠券(管理员)")
    public Result<List<Coupon>> getAllCoupons() {
        return Result.success(couponService.getAllCoupons());
    }
}
