package com.example.demoapi.repository;

import com.example.demoapi.model.RefreshToken;
import com.example.demoapi.model.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    // Find a token by its string value
    Optional<RefreshToken> findByToken(String token);

    // Delete a token belonging to a specific user
    void deleteByUserAccount(UserAccount userAccount);
}