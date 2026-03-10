package com.delta.account.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.delta.account.model.entity.Review;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface ReviewMapper extends BaseMapper<Review> {

    @Select("SELECT AVG(rating) FROM reviews WHERE reviewee_id = #{userId}")
    Double selectAvgRatingByUserId(@Param("userId") Long userId);

    @Select("SELECT AVG(rating) FROM reviews")
    Double selectAvgRating();
}
