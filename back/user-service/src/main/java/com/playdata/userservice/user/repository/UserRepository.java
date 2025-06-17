package com.playdata.userservice.user.repository;

import com.playdata.userservice.user.entity.User;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;

import javax.swing.text.html.Option;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByNickName(String nickName);
    Optional<User> findByNickName(String nickName);
    Optional<User> findBykakaoId(Long kakaoId);
}
