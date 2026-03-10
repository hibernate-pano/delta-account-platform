package com.delta.account.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.delta.account.model.entity.Account;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface AccountMapper extends BaseMapper<Account> {
    
    @Select("SELECT a.*, u.username as seller_username, u.nickname as seller_nickname, u.avatar as seller_avatar, u.credit_score as seller_credit_score " +
            "FROM accounts a " +
            "LEFT JOIN users u ON a.seller_id = u.id " +
            "WHERE a.id = #{id}")
    Account selectAccountWithSeller(@Param("id") Long id);

    @Select("SELECT * FROM accounts WHERE id = #{id} FOR UPDATE")
    Account selectByIdForUpdate(@Param("id") Long id);
}
