package com.example.demoapi.repository;

import com.example.demoapi.dto.response.HouseholdResponse;
import com.example.demoapi.model.Apartment;
import com.example.demoapi.model.Resident;
import com.example.demoapi.model.ApartmentType; // Nếu có enum
import com.example.demoapi.model.ApartmentStatus; // Nếu có enum
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.annotation.Rollback;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
// Dòng này QUAN TRỌNG: Nó bắt Spring dùng DB thật (PostgreSQL) thay vì H2
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ApartmentRepositoryLiveTest {

    @Autowired
    private ApartmentRepository apartmentRepository;

    @Autowired
    private ResidentRepository residentRepository;

    @Test
    @Rollback(true) // Mặc định là true: Chạy xong test sẽ tự xóa dữ liệu vừa tạo để không làm bẩn DB thật
    void testFindHouseholdsByKeyword_OnRealDB() {
        // --- 1. SETUP DATA (Tạo dữ liệu giả lập ngay trên DB thật) ---

        // Tạo Căn hộ P999
        Apartment apt = new Apartment();
        apt.setApartmentNumber("P999-TEST"); // Đặt tên lạ để không trùng
        apt.setArea(100.0);
        apt.setBuilding("B");
        apt.setFloor(9);
        // apt.setStatus(ApartmentStatus.OCCUPIED); // Nếu dùng Enum
        // apt.setType(ApartmentType.NORMAL);       // Nếu dùng Enum
        apt = apartmentRepository.save(apt);

        // Tạo Chủ hộ
        Resident owner = new Resident();
        owner.setName("Nguyen Van Test Owner");
        owner.setPhonenumber("0999888777");
        owner.setIsHost(true); // QUAN TRỌNG: Đánh dấu là chủ hộ
        owner.setApartment(apt);
        owner.setDob(LocalDate.of(1990, 1, 1));
        residentRepository.save(owner);

        // Tạo Thành viên (Vợ)
        Resident member = new Resident();
        member.setName("Vo Van Test");
        member.setIsHost(false);
        member.setApartment(apt);
        member.setDob(LocalDate.of(1995, 1, 1));
        residentRepository.save(member);

        // --- 2. EXECUTE (Gọi hàm Repository cần test) ---

        // Tìm kiếm theo số phòng
        List<HouseholdResponse> resultByRoom = apartmentRepository.findHouseholdsByKeyword("P999-TEST");

        // Tìm kiếm theo tên chủ hộ
        List<HouseholdResponse> resultByName = apartmentRepository.findHouseholdsByKeyword("Test Owner");

        // --- 3. VERIFY (Kiểm tra kết quả) ---

        // Check kết quả tìm theo phòng
        assertThat(resultByRoom).isNotEmpty();
        HouseholdResponse response = resultByRoom.get(0);

        System.out.println(">>> KẾT QUẢ TÌM ĐƯỢC: " + response);

        assertThat(response.getRoomNumber()).isEqualTo("P999-TEST");
        assertThat(response.getOwnerName()).isEqualTo("Nguyen Van Test Owner");
        assertThat(response.getPhoneNumber()).isEqualTo("0999888777");
        assertThat(response.getMemberCount()).isEqualTo(2L); // Phải đếm được 2 người (Chủ + Vợ)

        // Check kết quả tìm theo tên
        assertThat(resultByName).isNotEmpty();
        assertThat(resultByName.get(0).getRoomNumber()).isEqualTo("P999-TEST");
    }
}