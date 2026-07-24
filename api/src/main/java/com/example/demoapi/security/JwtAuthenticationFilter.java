package com.example.demoapi.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component // Đánh dấu đây là một Bean, để SecurityConfig có thể tiêm (inject)
@RequiredArgsConstructor // Tự động tạo constructor cho các trường 'final'
public class JwtAuthenticationFilter extends OncePerRequestFilter { // Đảm bảo chạy 1 lần/request

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService; // Spring sẽ tự động tiêm MyUserDetailsService

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // 1. Lấy header "Authorization" từ request
        final String authHeader = request.getHeader("Authorization");

        // 2. Kiểm tra xem header có tồn tại và có bắt đầu bằng "Bearer " không
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response); // Cho request đi tiếp
            return; // Dừng hàm
        }

        // 3. Lấy chuỗi JWT (bỏ 7 ký tự "Bearer ")
        final String jwt = authHeader.substring(7);
        final String username;

        try {
            // 4. Dùng JwtService để lấy username từ token
            username = jwtService.getUsernameFromAccessToken(jwt);
        } catch (Exception e) {
            // Nếu token lỗi (hết hạn, sai chữ ký...), cứ cho đi tiếp
            // Các filter sau của Spring Security sẽ bắt và báo lỗi 401 Unauthorized
            filterChain.doFilter(request, response);
            return;
        }

        // 5. Nếu có username VÀ user này chưa được xác thực trong context
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // 6. Tải thông tin User (role, v.v.) từ CSDL
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            // 7. Kiểm tra xem token có hợp lệ không
            if (jwtService.validateAccessToken(jwt, userDetails)) {

                // 8. Nếu hợp lệ, tạo một token xác thực
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null, // Không cần mật khẩu (vì đã xác thực bằng JWT)
                        userDetails.getAuthorities() // Gán các quyền (roles)
                );

                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // 9. Đây là bước "Đăng nhập": Cập nhật SecurityContextHolder
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // 10. Cho request đi tiếp
        filterChain.doFilter(request, response);
    }
}