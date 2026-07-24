package com.example.demoapi.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {
    @Value("${jwt.access-token.secret}")
    private String accessTokenSecret;
    @Value("${jwt.access-token.expiration-ms}")
    private long accessTokenExpiration;


    // Tạo AccessToken
    public String generateAccessToken(UserDetails userDetails) {
        String role = userDetails.getAuthorities().iterator().next().getAuthority();

        return Jwts.builder()
                .setSubject(userDetails.getUsername())
                .claim("role", role)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + accessTokenExpiration))
                .signWith(getSigningKey(accessTokenSecret), SignatureAlgorithm.HS256)
                .compact();
    }

    // Lấy username từ AccessToken
    public String getUsernameFromAccessToken(String token) {
        return getClaim(token, accessTokenSecret, Claims::getSubject);
    }


    public String getRoleFromAccessToken(String token) {
        return getClaim(token, accessTokenSecret, (claims) -> claims.get("role", String.class));
    }

    // Kiểm tra AccessToken
    public boolean validateAccessToken(String token, UserDetails userDetails) {
        final String username = getUsernameFromAccessToken(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token, accessTokenSecret));
    }

    // --- Các hàm private tiện ích (Giữ nguyên) ---
    private <T> T getClaim(String token, String secret, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaims(token, secret);
        return claimsResolver.apply(claims);
    }

    private Claims getAllClaims(String token, String secret) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey(secret))
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
    private boolean isTokenExpired(String token, String secret) {
        return getClaim(token, secret, Claims::getExpiration).before(new Date());
    }
    private Key getSigningKey(String secret) {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }
}