package com.example.demoapi.repository;

import com.example.demoapi.dto.response.HouseholdResponse;
import com.example.demoapi.model.Apartment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ApartmentRepository extends JpaRepository<Apartment, Integer> {

    @Query("""
    SELECT new com.example.demoapi.dto.response.HouseholdResponse(
        a.houseid,
        a.apartmentNumber,
        owner.name,
        a.area,
        (SELECT COUNT(r) FROM Resident r WHERE r.apartment.houseid = a.houseid),
        owner.phonenumber,
        a.building,
        a.status
    )
    FROM Apartment a
    LEFT JOIN Resident owner ON owner.apartment.houseid = a.houseid AND owner.isHost = true
    WHERE (:search IS NULL OR :search = '' 
           OR lower(a.apartmentNumber) LIKE lower(concat('%', :search, '%'))
           OR lower(owner.name) LIKE lower(concat('%', :search, '%')))
""")
    List<HouseholdResponse> findHouseholdsByKeyword(@Param("search") String search);

    @Query("""
    SELECT new com.example.demoapi.dto.response.HouseholdResponse(
        a.houseid,
        a.apartmentNumber,
        owner.name,
        a.area,
        (SELECT COUNT(r) FROM Resident r WHERE r.apartment.houseid = a.houseid),
        owner.phonenumber,
        a.building,
        a.status
    )
    FROM Apartment a
    LEFT JOIN Resident owner ON owner.apartment.houseid = a.houseid AND owner.isHost = true
    WHERE a.houseid = :id
""")
    Optional<HouseholdResponse> findHouseholdDetailById(@Param("id") Integer id);

    boolean existsByApartmentNumber(String apartmentNumber);

    Optional<Apartment> findByApartmentNumber(String apartmentNumber);


}