package com.example.demoapi.repository;

import com.example.demoapi.entity.FaceRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FaceRegistrationRepository extends JpaRepository<FaceRegistration, Long> {
    Optional<FaceRegistration> findByUserId(String userId);
    List<FaceRegistration> findAll();
}
