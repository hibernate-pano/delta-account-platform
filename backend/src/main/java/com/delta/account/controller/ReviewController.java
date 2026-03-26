package com.delta.account.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.delta.account.common.BusinessException;
import com.delta.account.common.Result;
import com.delta.account.mapper.OrderMapper;
import com.delta.account.mapper.ReviewMapper;
import com.delta.account.model.dto.ReviewCreateRequest;
import com.delta.account.model.entity.Order;
import com.delta.account.model.entity.Review;
import com.delta.account.model.entity.User;
import com.delta.account.service.NotificationService;
import com.delta.account.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@Tag(name = "评价管理")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewMapper reviewMapper;
    private final OrderMapper orderMapper;
    private final ReviewService reviewService;
    private final NotificationService notificationService;

    @GetMapping("/user/{userId}")
    @Operation(summary = "获取用户评价")
    public Result<List<Review>> getUserReviews(@PathVariable Long userId) {
        List<Review> reviews = reviewMapper.selectList(
                new QueryWrapper<Review>()
                        .eq("reviewee_id", userId)
                        .orderByDesc("created_at")
                        .last("LIMIT 20")
        );
        // 加载评价者信息
        for (Review review : reviews) {
            User reviewer = new User();
            reviewer.setId(review.getReviewerId());
            review.setReviewer(reviewer);
        }
        return Result.success(reviews);
    }

    @GetMapping("/user/{userId}/stats")
    @Operation(summary = "获取用户评价统计")
    public Result<ReviewService.UserReviewStats> getUserReviewStats(@PathVariable Long userId) {
        ReviewService.UserReviewStats stats = reviewService.getUserReviewStats(userId);
        return Result.success(stats);
    }

    @PostMapping
    @Operation(summary = "创建评价")
    public Result<Void> createReview(
            @Valid @RequestBody ReviewCreateRequest request,
            @AuthenticationPrincipal User user) {

        Long orderId = request.getOrderId();
        Integer rating = request.getRating();
        String content = request.getContent();

        // 查找订单并校验
        Order order = orderMapper.selectById(orderId);
        if (order == null) {
            throw new BusinessException("订单不存在");
        }

        // 订单必须已完成
        if (!"COMPLETED".equals(order.getStatus())) {
            throw new BusinessException("订单未完成，无法评价");
        }

        // 只有买家或卖家可以评价
        boolean isBuyer = order.getBuyerId().equals(user.getId());
        boolean isSeller = order.getSellerId().equals(user.getId());
        if (!isBuyer && !isSeller) {
            throw new BusinessException("您不是该订单的参与方");
        }

        // 确定被评价人（买家评卖家，卖家评买家）
        Long revieweeId = isBuyer ? order.getSellerId() : order.getBuyerId();

        // 防止重复评价
        Long existCount = reviewMapper.selectCount(
                new QueryWrapper<Review>()
                        .eq("order_id", orderId)
                        .eq("reviewer_id", user.getId())
        );
        if (existCount > 0) {
            throw new BusinessException("您已对此订单评价过");
        }

        Review review = new Review();
        review.setOrderId(orderId);
        review.setReviewerId(user.getId());
        review.setRevieweeId(revieweeId);
        review.setRating(rating);
        review.setContent(content);

        reviewMapper.insert(review);

        // 通知被评价人
        notificationService.notifyNewReview(revieweeId, orderId, rating);

        return Result.success("评价成功", (Void) null);
    }

    @PostMapping("/{id}/reply")
    @Operation(summary = "回复评价")
    public Result<Void> replyReview(
            @PathVariable Long id,
            @RequestParam String reply,
            @AuthenticationPrincipal User user) {
        reviewService.replyReview(id, reply, user.getId());
        return Result.success("回复成功", (Void) null);
    }
}
