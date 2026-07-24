package com.example.demoapi.repository;

import com.example.demoapi.entity.AccessPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AccessPointRepository extends JpaRepository<AccessPoint, Long> {
    Optional<AccessPoint> findByName(String name);
}
