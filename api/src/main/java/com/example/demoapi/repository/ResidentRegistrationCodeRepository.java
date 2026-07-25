package com.example.demoapi.repository;

import com.example.demoapi.model.ResidentRegistrationCode;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.List;
import java.util.Optional;

public interface ResidentRegistrationCodeRepository extends JpaRepository<ResidentRegistrationCode, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<ResidentRegistrationCode> findByCode(String code);

    boolean existsByCode(String code);

    List<ResidentRegistrationCode> findTop50ByOrderByCreatedAtDesc();
}
