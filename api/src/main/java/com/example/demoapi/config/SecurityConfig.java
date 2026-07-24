package com.example.demoapi.config; // hoặc .security

import java.util.Arrays;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.example.demoapi.security.JwtAuthenticationFilter;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. Tắt CSRF (vì dùng API)
                .csrf(csrf -> csrf.disable())
                // 2. KÍCH HOẠT CORS VÀ TRỎ VỀ BEAN CẤU HÌNH BÊN DƯỚI
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // 3. Phân quyền
                .authorizeHttpRequests(auth -> auth
                // Cho phép Auth
                .requestMatchers("/api/auth/**").permitAll()
                // Cho phép health check endpoints
                .requestMatchers("/api/lpr/health").permitAll()
                .requestMatchers("/api/parking-pricing/**").permitAll()
                // --- QUAN TRỌNG NHẤT: CHO PHÉP METHOD OPTIONS ---
                // Dòng này giúp Preflight Request đi qua mà không cần Token
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Các request khác phải đăng nhập
                .anyRequest().authenticated()
                )
                // 4. Session Stateless
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // 5. Thêm Filter JWT
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // --- BEAN CẤU HÌNH CORS NẰM NGAY TRONG SECURITY ---
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Cho phép tất cả các domain (hoặc sửa thành domain cụ thể của Google IDX nếu muốn chặt chẽ)
        configuration.setAllowedOriginPatterns(List.of(
                "https://main.d164cthseo5mkf.amplifyapp.com",
                "https://refactor.d164cthseo5mkf.amplifyapp.com",
                "https://d1kyo8tlhbz0hy.cloudfront.net",
                "http://localhost:3000",
                // Vercel
                "https://bluemoon-apartment-management-system.vercel.app",
                "https://*.vercel.app"
        ));

        // Cho phép các method
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"));

        // Cho phép mọi header (bao gồm cả ngrok-skip-browser-warning)
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "ngrok-skip-browser-warning", "x-requested-with"));

        // Cho phép gửi Cookie/Credential
        configuration.setAllowCredentials(true);

        // Cache lại kết quả Preflight trong 1 giờ để trình duyệt đỡ hỏi nhiều
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
