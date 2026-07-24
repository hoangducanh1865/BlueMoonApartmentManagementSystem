package com.example.demoapi.controller;

import java.util.Arrays;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demoapi.dto.LoginRequest;
import com.example.demoapi.dto.LoginResponse;
import com.example.demoapi.dto.RefreshTokenResponse;
import com.example.demoapi.dto.request.RegisterRequest;
import com.example.demoapi.service.AuthenticationService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService authenticationService;

    @Value("${jwt.response-cookie.secure}")
    private boolean secureCookie;

    // --- LOGIN ---
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        // Gọi Service
        AuthenticationService.AuthResult result = authenticationService.login(loginRequest);

        // Set Cookie
        setRefreshTokenCookie(response, result.getRefreshToken(), 7 * 24 * 60 * 60); // 7 days

        // Trả về Body
        return ResponseEntity.ok(result.getResponseBody());
    }

    // --- REFRESH TOKEN ---
    @PostMapping("/refresh")
    public ResponseEntity<RefreshTokenResponse> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        String oldRefreshToken = getRefreshTokenFromCookie(request);

        // Gọi Service
        AuthenticationService.RefreshResult result = authenticationService.refreshToken(oldRefreshToken);

        // Set Cookie Mới
        setRefreshTokenCookie(response, result.getNewRefreshToken(), 7 * 24 * 60 * 60);

        return ResponseEntity.ok(result.getResponseBody());
    }

    // --- LOGOUT ---
    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = getRefreshTokenFromCookie(request);

        // Gọi Service
        authenticationService.logout(refreshToken);

        // Xóa Cookie
        setRefreshTokenCookie(response, "", 0);

        return ResponseEntity.ok("Logout successful");
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            authenticationService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body("Đăng ký tài khoản thành công!");
        } catch (RuntimeException e) {
            // Trả về lỗi 400 Bad Request kèm thông báo lỗi cụ thể
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // --- Helper Methods cho Cookie ---
    private void setRefreshTokenCookie(HttpServletResponse response, String token, long maxAgeSeconds) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", token)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(secureCookie ? "None" : "Lax") // Required for cross-origin cookies
                .path("/api/auth")
                .maxAge(maxAgeSeconds)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private String getRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return null;
        }

        return Arrays.stream(request.getCookies())
                .filter(c -> c.getName().equals("refreshToken"))
                .findFirst()
                .map(Cookie::getValue)
                .orElseThrow(() -> new RuntimeException("Refresh token cookie not found"));
    }
}
