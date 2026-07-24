package com.example.demoapi.repository;

import com.example.demoapi.model.Resident;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ResidentRepository extends JpaRepository<Resident, Integer> {
    // Spring Data JPA tự hiểu: "Tìm một UserAccount bằng cột username"
    Optional<Resident> findByResidentid(Integer residentid);

    Optional<Resident> findFirstByPhonenumber(String phonenumber);

    Optional<Resident> findByApartment_HouseidAndIsHostTrue(Integer houseId);

    Long countByApartment_Houseid(Integer houseId);

    List<Resident> findByApartment_Houseid(Integer id);

    @Query("""
        SELECT r FROM Resident r
        LEFT JOIN r.apartment a
        WHERE (:keyword IS NULL OR :keyword = ''
           OR lower(r.name) LIKE lower(concat('%', :keyword, '%'))
           OR r.phonenumber LIKE concat('%', :keyword, '%')
           OR lower(a.apartmentNumber) LIKE lower(concat('%', :keyword, '%')))
    """)
    Page<Resident> findAllResidents(@Param("keyword") String keyword, Pageable pageable);
}