package com.example.demoapi.service;

import com.example.demoapi.model.RefreshToken;
import com.example.demoapi.model.UserAccount;
import com.example.demoapi.repository.RefreshTokenRepository;
import com.example.demoapi.repository.UserAccountRepository;
import com.example.demoapi.security.JwtService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final UserAccountRepository userAccountRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh-token.expiration-ms}")
    private long refreshTokenExpirationMs;

    // --- THÊM MỚI: TẠO MỘT CLASS NỘI BỘ ĐỂ TRẢ VỀ 2 GIÁ TRỊ ---
    /**
     * Một DTO nội bộ để trả về kết quả của việc xoay vòng token
     */
    public record RotationResult(String newRefreshTokenString, String username) {}
    // --- HẾT THÊM MỚI ---


    @Transactional
    public String createRefreshToken(String email) {
        UserAccount userAccount = userAccountRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // Xóa token cũ (nếu có)
        refreshTokenRepository.deleteByUserAccount(userAccount);

        refreshTokenRepository.flush();

        // Tạo token mới
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUserAccount(userAccount);
        refreshToken.setToken(UUID.randomUUID().toString()); // Token là chuỗi ngẫu nhiên
        refreshToken.setExpiryDate(Instant.now().plusMillis(refreshTokenExpirationMs));

        refreshTokenRepository.save(refreshToken);
        return refreshToken.getToken();
    }

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token)
                .filter(this::verifyExpiration);
    }

    @Transactional
    public RotationResult rotateRefreshToken(String oldToken) {
        // 1. Tìm token cũ, nếu không thấy (hoặc hết hạn) -> báo lỗi
        RefreshToken token = findByToken(oldToken)
                .orElseThrow(() -> new RuntimeException("Refresh token not found or expired!"));

        // 2. Lấy username từ token cũ TRƯỚC KHI xóa nó
        String username = token.getUserAccount().getEmail();

        // 3. Tạo token mới (hàm createRefreshToken đã tự xóa token cũ)
        String newRefreshTokenString = createRefreshToken(username);

        // 4. Trả về cả token mới VÀ username
        return new RotationResult(newRefreshTokenString, username);
    }
    // --- HẾT SỬA ---

    private boolean verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(token);
            return false;
        }
        return true;
    }

    @Transactional
    public void deleteByToken(String token) {
        refreshTokenRepository.findByToken(token)
                .ifPresent(refreshTokenRepository::delete);
    }
}