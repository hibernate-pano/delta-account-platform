package com.delta.account.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.delta.account.model.entity.Withdrawal;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface WithdrawalMapper extends BaseMapper<Withdrawal> {
}
