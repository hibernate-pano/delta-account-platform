package com.delta.account.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.delta.account.model.entity.Order;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface OrderMapper extends BaseMapper<Order> {

    @Select("SELECT * FROM orders WHERE id = #{id} FOR UPDATE")
    Order selectByIdForUpdate(@Param("id") Long id);

    @Select("SELECT * FROM orders WHERE status = 'PENDING' AND created_at < #{timeout}")
    List<Order> selectExpiredPendingOrders(@Param("timeout") LocalDateTime timeout);

    @Select("SELECT * FROM orders WHERE status = 'PAID' AND type = 'RENT' AND rent_end < #{now}")
    List<Order> selectExpiredRentals(@Param("now") LocalDateTime now);
}
