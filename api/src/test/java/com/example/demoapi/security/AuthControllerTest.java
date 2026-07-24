package com.example.demoapi.security;

// Import các Model và Repository cần thiết cho setup
import com.example.demoapi.model.Apartment;
import com.example.demoapi.model.Resident;
import com.example.demoapi.model.UserAccount;
import com.example.demoapi.repository.ApartmentRepository;
import com.example.demoapi.repository.ResidentRepository;
import com.example.demoapi.repository.UserAccountRepository;
import com.example.demoapi.repository.RefreshTokenRepository; // <-- Import repo mới

// Import DTO
import com.example.demoapi.dto.LoginRequest;

// Import thư viện Test
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie; // <-- Dùng cho Cookie
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult; // <-- Dùng để lấy Response
import org.springframework.transaction.annotation.Transactional;

// Import các hàm static để code test ngắn gọn
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Transactional // Đảm bảo CSDL được rollback (hoàn tác) sau mỗi test
@AutoConfigureMockMvc // Tự động cấu hình MockMvc
public class AuthControllerTest {

    // --- CÁC BEAN CẦN TIÊM (INJECT) ---
    @Autowired
    private MockMvc mockMvc; // Dùng để giả lập API call

    @Autowired
    private ObjectMapper objectMapper; // Dùng để chuyển DTO sang JSON

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Repositories dùng cho hàm setup()
    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private ResidentRepository residentRepository;

    @Autowired
    private ApartmentRepository apartmentRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository; // Cần để dọn dẹp (nếu cần)

    /**
     * Hàm này chạy TRƯỚC MỖI HÀM @Test, đảm bảo chúng ta luôn có 1 user
     * "testuser" / "password123"
     */
    @BeforeEach
    void setup() {
        // 1a. Tạo Apartment (Cha)
        Apartment testApt = new Apartment();
        testApt.setBuilding("Test Tower");
        testApt.setFloor(1);
        testApt.setArea(50.0);
        testApt.setApartmentNumber("T-101");
        testApt.setStatus(com.example.demoapi.model.ApartmentStatus.EMPTY);
        testApt.setType(com.example.demoapi.model.ApartmentType.NORMAL);
        apartmentRepository.save(testApt);

        // 1b. Tạo Resident (Con)
        Resident testResident = new Resident();
        testResident.setName("Test User");
        testResident.setPhonenumber("0123456789");
        testResident.setApartment(testApt); // Nối với Apartment
        residentRepository.save(testResident);

        // 1c. Tạo UserAccount (Cháu)
        UserAccount testUser = new UserAccount();
        testUser.setEmail("testuser"); // Tên đăng nhập
        testUser.setPassword(passwordEncoder.encode("password123")); // Mật khẩu
        testUser.setRole("ADMIN"); // Gán vai trò
        testUser.setResident(testResident); // Nối với Resident
        userAccountRepository.save(testUser);

        System.out.println(">>> Setup: Đã tạo user 'testuser' với pass 'password123'");
    }

    // --- CÁC HÀM TEST ---
    @Test
    void test_Login_Success() throws Exception {
        // Arrange (Chuẩn bị DTO)
        LoginRequest loginRequest = new LoginRequest("testuser", "password123");
        String loginRequestJson = objectMapper.writeValueAsString(loginRequest);

        // Act & Assert (Thực hiện & Kiểm tra)
        mockMvc.perform(post("/api/auth/login") // Giả lập POST /login
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginRequestJson))
                .andExpect(status().isOk()) // Mong đợi HTTP 200 OK
                .andExpect(jsonPath("$.token").exists()) // Mong đợi body có trường "token"
                .andExpect(cookie().exists("refreshToken")) // Mong đợi có cookie tên "refreshToken"
                .andExpect(cookie().httpOnly("refreshToken", true)); // Mong đợi cookie là HttpOnly
    }

    @Test
    void test_Login_Fail_WrongPassword() throws Exception {
        // Arrange
        LoginRequest loginRequest = new LoginRequest("testuser", "wrongpassword");
        String loginRequestJson = objectMapper.writeValueAsString(loginRequest);

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginRequestJson))
                .andExpect(status().isBadRequest()); // Controller trả về HTTP 400 Bad Request cho sai mật khẩu
    }

    @Test
    void test_Refresh_and_Logout_Success() throws Exception {
        // --- PHẦN 1: ĐĂNG NHẬP (LOGIN) ĐỂ LẤY COOKIE ---
        LoginRequest loginRequest = new LoginRequest("testuser", "password123");
        String loginRequestJson = objectMapper.writeValueAsString(loginRequest);

        // Chạy /login và lưu kết quả
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginRequestJson))
                .andExpect(status().isOk())
                .andReturn(); // Lấy kết quả trả về

        // Trích xuất cookie từ kết quả login
        Cookie refreshTokenCookie = loginResult.getResponse().getCookie("refreshToken");
        assertNotNull(refreshTokenCookie, "Refresh token cookie không được null sau khi login");
        String oldTokenValue = refreshTokenCookie.getValue();

        // --- PHẦN 2: TEST /refresh ---
        System.out.println(">>> Testing /refresh...");

        // Chạy /refresh và dùng cookie vừa lấy được
        MvcResult refreshResult = mockMvc.perform(post("/api/auth/refresh")
                .cookie(refreshTokenCookie)) // <-- Gắn cookie vào request
                .andExpect(status().isOk()) // Mong đợi 200 OK
                .andExpect(jsonPath("$.accessToken").exists()) // Mong đợi accessToken MỚI
                .andExpect(cookie().exists("refreshToken")) // Mong đợi cookie refreshToken MỚI
                .andReturn();

        // Lấy cookie MỚI (đã xoay vòng)
        Cookie rotatedCookie = refreshResult.getResponse().getCookie("refreshToken");
        assertNotNull(rotatedCookie, "Cookie refreshToken mới không được null sau khi refresh");
        String newTokenValue = rotatedCookie.getValue();

        // KIỂM TRA QUAN TRỌNG: Token MỚI phải KHÁC token CŨ
        assertNotEquals(oldTokenValue, newTokenValue, "Refresh token phải được xoay vòng (rotating)");

        // --- PHẦN 3: TEST /logout ---
        System.out.println(">>> Testing /logout...");

        mockMvc.perform(post("/api/auth/logout")
                .cookie(rotatedCookie)) // <-- Gắn cookie MỚI NHẤT
                .andExpect(status().isOk()) // Mong đợi 200 OK
                .andExpect(cookie().exists("refreshToken")) // Mong đợi server trả về cookie
                .andExpect(cookie().maxAge("refreshToken", 0)); // Mong đợi cookie đã HẾT HẠN (maxAge = 0)
    }
}
