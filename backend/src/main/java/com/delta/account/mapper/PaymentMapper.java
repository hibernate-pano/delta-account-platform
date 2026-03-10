package com.delta.account.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.delta.account.model.entity.Payment;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PaymentMapper extends BaseMapper<Payment> {
}
