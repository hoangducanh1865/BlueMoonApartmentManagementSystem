package com.example.demoapi.repository;

import com.example.demoapi.model.Resident;
import com.example.demoapi.model.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccount, Integer> {
    // Spring Data JPA tự hiểu: "Tìm một UserAccount bằng cột username"
    Optional<UserAccount> findByEmail(String email);

    // Kiểm tra tồn tại
    Boolean existsByEmail(String email);

    Boolean existsByResident(Resident resident);

    void deleteByResident_Residentid(Integer residentId);

    void deleteByResident(Resident resident);
}