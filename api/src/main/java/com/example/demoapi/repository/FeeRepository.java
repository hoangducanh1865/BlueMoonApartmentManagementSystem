package com.example.demoapi.repository;

import com.example.demoapi.model.Fee;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeeRepository extends JpaRepository<Fee, Integer> {
    // Kiểm tra trùng tên
    boolean existsByFeename(String feename);

    // Check trùng tên (nhưng trừ chính nó ra - dùng khi Update)
    boolean existsByFeenameAndIdNot(String feeName, Integer id);
}