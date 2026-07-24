package com.example.demoapi.repository;

import com.example.demoapi.entity.BuildingAccessLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BuildingAccessLogRepository extends JpaRepository<BuildingAccessLog, Long> {
    List<BuildingAccessLog> findByOrderByTimestampDesc();

    @Query("SELECT l FROM BuildingAccessLog l WHERE " +
           "(:search IS NULL OR LOWER(l.userName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.userId) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.accessPoint.name) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:startDate IS NULL OR l.timestamp >= :startDate) AND " +
           "(:endDate IS NULL OR l.timestamp <= :endDate)")
    Page<BuildingAccessLog> searchLogs(@Param("search") String search,
                                       @Param("startDate") LocalDateTime startDate,
                                       @Param("endDate") LocalDateTime endDate,
                                       Pageable pageable);
}
