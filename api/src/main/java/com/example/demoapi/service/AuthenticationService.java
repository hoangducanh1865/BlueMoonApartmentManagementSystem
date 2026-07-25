package com.example.demoapi.service;

import com.example.demoapi.dto.LoginRequest;
import com.example.demoapi.dto.LoginResponse;
import com.example.demoapi.dto.RefreshTokenResponse;
import com.example.demoapi.dto.request.RegisterRequest;
import com.example.demoapi.model.Resident;
import com.example.demoapi.model.ResidentRegistrationCode;
import com.example.demoapi.model.UserAccount;
import com.example.demoapi.repository.ResidentRepository;
import com.example.demoapi.repository.UserAccountRepository;
import com.example.demoapi.security.JwtService;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UserAccountRepository userAccountRepository; // Dùng repo này để lấy full thông tin Resident
    private final UserDetailsService userDetailsService;
    private final ResidentRepository residentRepository;
    private final PasswordEncoder passwordEncoder;
    private final ResidentRegistrationCodeService registrationCodeService;

    // Class nội bộ để chứa kết quả trả về cho Controller (Body + Cookie Value)
    @Data
    @Builder
    public static class AuthResult {
        private LoginResponse responseBody;
        private String refreshToken;
    }

    @Data
    @Builder
    public static class RefreshResult {
        private RefreshTokenResponse responseBody;
        private String newRefreshToken;
    }

    // --- 1. LOGIN LOGIC ---
    @Transactional
    public AuthResult login(LoginRequest request) {
        // A. Xác thực
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // B. Tạo Token
        String accessToken = jwtService.generateAccessToken(userDetails);
        String refreshToken = refreshTokenService.createRefreshToken(userDetails.getUsername());

        // C. Lấy thông tin chi tiết từ DB để build JSON response đẹp
        UserAccount userAccount = userAccountRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("User not found"));
        ensureResidentCode(userAccount.getResident());

        // D. Mapping dữ liệu (UserAccount -> LoginResponse)
        LoginResponse loginResponse = buildLoginResponse(accessToken, userAccount);

        return AuthResult.builder()
                .responseBody(loginResponse)
                .refreshToken(refreshToken)
                .build();
    }

    // --- 2. REFRESH LOGIC ---
    @Transactional
    public RefreshResult refreshToken(String oldRefreshToken) {
        // A. Xoay vòng token
        RefreshTokenService.RotationResult rotationResult = refreshTokenService.rotateRefreshToken(oldRefreshToken);

        // B. Tạo Access Token mới
        UserDetails userDetails = userDetailsService.loadUserByUsername(rotationResult.username());
        String newAccessToken = jwtService.generateAccessToken(userDetails);

        return RefreshResult.builder()
                .responseBody(new RefreshTokenResponse(newAccessToken))
                .newRefreshToken(rotationResult.newRefreshTokenString())
                .build();
    }

    // --- 3. LOGOUT LOGIC ---
    public void logout(String refreshToken) {
        if (refreshToken != null) {
            refreshTokenService.deleteByToken(refreshToken);
        }
    }

    // --- HELPER: Mapping Data ---
    private LoginResponse buildLoginResponse(String accessToken, UserAccount account) {
        Resident resident = account.getResident();

        // Default values (Cho Admin hệ thống hoặc user chưa có thông tin resident)
        String email = account.getEmail(); // Fallback
        String fullName = "System User";
        String avatar = null;
        Integer householdId = null;
        Integer residentId = null;
        Integer residentCode = null;

        if (resident != null) {
            email = resident.getEmail();
            fullName = resident.getName();
            avatar = resident.getAvatar();
            residentId = resident.getResidentid();
            residentCode = resident.getResidentCode();

            // Lấy ID căn hộ nếu có
            if (resident.getApartment() != null) {
                householdId = resident.getApartment().getHouseid();
            }
        }

        LoginResponse.UserDetail userDetail = LoginResponse.UserDetail.builder()
                .id(account.getAccountid())
                .email(email)
                .fullName(fullName)
                .role(account.getRole())
                .avatar(avatar)
                .householdId(householdId)
                .residentId(residentId)
                .residentCode(residentCode)
                .build();

        return LoginResponse.builder()
                .token(accessToken)
                .user(userDetail)
                .build();
    }

    @Transactional
    public void register(RegisterRequest request) {
        // 1. Mã đăng ký an toàn do BQL cấp, có hạn dùng và chỉ dùng một lần.
        ResidentRegistrationCode registrationCode = registrationCodeService.getUsableCode(request.getResidentCode());
        Resident resident = registrationCode.getResident();

        // 2. CHECK BẢO MẬT: Khớp lệnh Số điện thoại
        // (So sánh SĐT người dùng nhập vs SĐT BQL đã nhập)
        if (!resident.getPhonenumber().equals(request.getPhoneNumber())) {
            throw new RuntimeException("Số điện thoại không khớp với dữ liệu đăng ký!");
        }

        // 3. CHECK BẢO MẬT: Khớp lệnh Email (Tùy chọn, nhưng nên có)
        // Đảm bảo user không dùng email của người khác để đăng ký cho resident này
        if (resident.getEmail() != null && !resident.getEmail().equalsIgnoreCase(request.getEmail())) {
            throw new RuntimeException("Email đăng ký không trùng khớp với hồ sơ cư dân!");
        }

        // 4. Kiểm tra xem cư dân này đã có tài khoản chưa?
        if (userAccountRepository.existsByResident(resident)) {
            throw new RuntimeException("Cư dân này đã có tài khoản rồi!");
        }

        // 5. Kiểm tra xem Email này đã tồn tại trong bảng UserAccount chưa?
        if (userAccountRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email này đã được sử dụng!");
        }

        // 6. Tạo UserAccount mới
        UserAccount newUser = new UserAccount();
        newUser.setEmail(request.getEmail()); // Username là Email
        newUser.setPassword(passwordEncoder.encode(request.getPassword()));
        newUser.setRole("RESIDENT"); // Mặc định là Cư dân
        newUser.setResident(resident); // Liên kết khóa ngoại (Quan trọng!)

        ensureResidentCode(resident);

        userAccountRepository.save(newUser);
        registrationCodeService.markCodeUsed(registrationCode);
    }

    private void ensureResidentCode(Resident resident) {
        if (resident != null && resident.getResidentCode() == null) {
            resident.setResidentCode(nextResidentCode());
            residentRepository.save(resident);
        }
    }

    private synchronized Integer nextResidentCode() {
        Integer maxResidentCode = residentRepository.findMaxResidentCode();
        if (maxResidentCode != null && maxResidentCode > 0) {
            return maxResidentCode + 1;
        }
        return residentRepository.countResidentProfiles().intValue();
    }
}
