package com.delta.account.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.delta.account.mapper.ReviewMapper;
import com.delta.account.model.entity.Review;
import com.delta.account.model.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewMapper reviewMapper;

    /**
     * 创建评价
     */
    @Transactional
    public Review createReview(Long orderId, Long reviewerId, Long revieweeId, Integer rating, String content) {
        // 检查是否已评价
        QueryWrapper<Review> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("order_id", orderId);
        queryWrapper.eq("reviewer_id", reviewerId);
        if (reviewMapper.selectCount(queryWrapper) > 0) {
            throw new com.delta.account.common.BusinessException("您已评价过此订单");
        }

        Review review = new Review();
        review.setOrderId(orderId);
        review.setReviewerId(reviewerId);
        review.setRevieweeId(revieweeId);
        review.setRating(rating);
        review.setContent(content);

        reviewMapper.insert(review);
        return review;
    }

    /**
     * 商家回复评价
     */
    @Transactional
    public void replyReview(Long reviewId, String reply, Long userId) {
        Review review = reviewMapper.selectById(reviewId);
        if (review == null) {
            throw new com.delta.account.common.BusinessException("评价不存在");
        }

        // 只有被评价人可以回复
        if (!review.getRevieweeId().equals(userId)) {
            throw new com.delta.account.common.BusinessException("无权限操作");
        }

        review.setReply(reply);
        review.setRepliedAt(LocalDateTime.now());
        reviewMapper.updateById(review);
    }

    /**
     * 获取用户收到的评价
     */
    public Page<Review> getUserReviews(Long userId, Integer page, Integer size) {
        Page<Review> pageParam = new Page<>(page, size);
        QueryWrapper<Review> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("reviewee_id", userId);
        queryWrapper.orderByDesc("created_at");

        Page<Review> result = reviewMapper.selectPage(pageParam, queryWrapper);
        return result;
    }

    /**
     * 获取用户评价统计
     */
    public UserReviewStats getUserReviewStats(Long userId) {
        QueryWrapper<Review> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("reviewee_id", userId);

        Long totalCount = reviewMapper.selectCount(queryWrapper);

        // 计算平均评分
        Double avgRating = reviewMapper.selectAvgRatingByUserId(userId);

        // 统计各评分数量
        int fiveStar = countRating(userId, 5);
        int fourStar = countRating(userId, 4);
        int threeStar = countRating(userId, 3);
        int twoStar = countRating(userId, 2);
        int oneStar = countRating(userId, 1);

        return new UserReviewStats(
                totalCount != null ? totalCount.intValue() : 0,
                avgRating != null ? avgRating.doubleValue() : 0.0,
                fiveStar, fourStar, threeStar, twoStar, oneStar
        );
    }

    private int countRating(Long userId, int rating) {
        QueryWrapper<Review> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("reviewee_id", userId);
        queryWrapper.eq("rating", rating);
        Long count = reviewMapper.selectCount(queryWrapper);
        return count != null ? count.intValue() : 0;
    }

    /**
     * 用户评价统计
     */
    public static class UserReviewStats {
        public int totalCount;
        public double avgRating;
        public int fiveStar;
        public int fourStar;
        public int threeStar;
        public int twoStar;
        public int oneStar;

        public UserReviewStats(int totalCount, double avgRating, int fiveStar, int fourStar,
                              int threeStar, int twoStar, int oneStar) {
            this.totalCount = totalCount;
            this.avgRating = avgRating;
            this.fiveStar = fiveStar;
            this.fourStar = fourStar;
            this.threeStar = threeStar;
            this.twoStar = twoStar;
            this.oneStar = oneStar;
        }
    }
}
