package com.delta.account.controller;

import com.delta.account.common.Result;
import com.delta.account.mapper.ReviewMapper;
import com.delta.account.model.entity.Review;
import com.delta.account.model.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
    
    @GetMapping("/user/{userId}")
    @Operation(summary = "获取用户评价")
    public Result<List<Review>> getUserReviews(@PathVariable Long userId) {
        List<Review> reviews = reviewMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<Review>()
                        .eq("reviewee_id", userId)
                        .orderByDesc("created_at")
                        .last("LIMIT 10")
        );
        return Result.success(reviews);
    }
    
    @PostMapping
    @Operation(summary = "创建评价")
    public Result<Void> createReview(
            @RequestParam Long orderId,
            @RequestParam Long revieweeId,
            @RequestParam Integer rating,
            @RequestParam(required = false) String content,
            @AuthenticationPrincipal User user) {
        
        Review review = new Review();
        review.setOrderId(orderId);
        review.setReviewerId(user.getId());
        review.setRevieweeId(revieweeId);
        review.setRating(rating);
        review.setContent(content);
        
        reviewMapper.insert(review);
        return Result.success("评价成功");
    }
}
