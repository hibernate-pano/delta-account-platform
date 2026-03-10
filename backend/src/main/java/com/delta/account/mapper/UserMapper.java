package com.delta.account.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.delta.account.model.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface UserMapper extends BaseMapper<User> {

    @Select("SELECT * FROM users WHERE id = #{id} FOR UPDATE")
    User selectByIdForUpdate(@Param("id") Long id);
}
