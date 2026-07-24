package com.example.demoapi.service;

import com.example.demoapi.dto.request.RegistrationRequest;
import com.example.demoapi.dto.response.RegistrationResponse;
import com.example.demoapi.model.*;
import com.example.demoapi.repository.ApartmentRepository;
import com.example.demoapi.repository.ResidentRepository;
import com.example.demoapi.repository.TemporaryRegistrationRepository;
import com.example.demoapi.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RegistrationService {

    private final TemporaryRegistrationRepository registrationRepository;
    private final ResidentRepository residentRepository;
    private final ApartmentRepository apartmentRepository;
    private final UserAccountRepository userAccountRepository;

    // 1. TẠO YÊU CẦU MỚI
    @Transactional
    public TemporaryRegistration createRequest(RegistrationRequest req) {
        // --- 1. LOGIC PHÂN QUYỀN (AUTHORIZATION) ---
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = auth.getName();

        // Kiểm tra xem có phải Admin không
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        // Nếu KHÔNG phải Admin thì phải check kỹ
        if (!isAdmin) {
            UserAccount currentUser = userAccountRepository.findByEmail(currentEmail)
                    .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

            // Lấy thông tin căn hộ của người đang login
            Resident currentResident = currentUser.getResident();
            if (currentResident == null || currentResident.getApartment() == null) {
                throw new RuntimeException("Tài khoản của bạn chưa được liên kết với căn hộ nào!");
            }
            Integer userHouseId = currentResident.getApartment().getHouseid();

            // RULE 1: Không được đăng ký giùm nhà hàng xóm
            if (!userHouseId.equals(req.getHouseId())) {
                throw new RuntimeException("Bạn chỉ được phép đăng ký tạm trú/tạm vắng cho căn hộ của mình!");
            }

            // RULE 2: Người được đăng ký (residentId) cũng phải thuộc căn hộ này
            // (Tránh trường hợp user ở nhà 1, nhưng cố tình gửi request residentId của nhà 2)
            Resident targetResident = residentRepository.findById(req.getResidentId())
                    .orElseThrow(() -> new RuntimeException("Cư dân cần đăng ký không tồn tại"));

            if (targetResident.getApartment() == null || !targetResident.getApartment().getHouseid().equals(userHouseId)) {
                throw new RuntimeException("Cư dân này không thuộc căn hộ của bạn!");
            }
        }
        // --- KẾT THÚC LOGIC PHÂN QUYỀN ---

        // --- 2. LOGIC NGHIỆP VỤ CŨ ---
        // (Lưu ý: Nếu không phải Admin, ta đã findById ở trên rồi, nhưng để code gọn thì cứ find lại hoặc tối ưu tùy bạn)
        Resident resident = residentRepository.findById(req.getResidentId())
                .orElseThrow(() -> new RuntimeException("Cư dân không tồn tại"));

        Apartment apartment = apartmentRepository.findById(req.getHouseId())
                .orElseThrow(() -> new RuntimeException("Căn hộ không tồn tại"));

        TemporaryRegistration reg = new TemporaryRegistration();
        reg.setResident(resident);
        reg.setApartment(apartment);
        reg.setType(req.getType());
        reg.setStartDate(req.getStartDate());
        reg.setEndDate(req.getEndDate());
        reg.setReason(req.getReason());

        // Nếu là Admin tạo -> Có thể cho Auto Approve luôn (tùy nghiệp vụ)
        // Nếu là Cư dân tạo -> Bắt buộc Pending
        if (isAdmin) {
            reg.setStatus(RegistrationStatus.APPROVED);
            reg.setNote("Được tạo bởi Admin");
        } else {
            reg.setStatus(RegistrationStatus.PENDING);
        }

        return registrationRepository.save(reg);
    }

    // 2. DUYỆT YÊU CẦU (Admin)
    @Transactional
    public void approveRequest(Integer id, boolean isApproved, String adminNote) {
        TemporaryRegistration reg = registrationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Đơn đăng ký không tồn tại"));

        if (isApproved) {
            reg.setStatus(RegistrationStatus.APPROVED);

            if (reg.getType() == RegistrationType.TAM_VANG) {
                reg.getResident().setState(ResidentStatus.TAM_VANG);
                residentRepository.save(reg.getResident());
            }
        } else {
            reg.setStatus(RegistrationStatus.REJECTED);
        }

        reg.setNote(adminNote);
        registrationRepository.save(reg);
    }

    public Page<RegistrationResponse> getAllRequests(Integer houseId, RegistrationStatus status, RegistrationType type, Pageable pageable) {
        // 1. Gọi Repo lấy Entity
        Page<TemporaryRegistration> pageResult = registrationRepository.findAllRequests(houseId, status, type, pageable);

        // 2. Map Entity -> DTO
        return pageResult.map(reg -> RegistrationResponse.builder()
                .id(reg.getId())
                .residentName(reg.getResident().getName())
                .roomNumber(reg.getApartment().getApartmentNumber())
                .type(reg.getType())
                .startDate(reg.getStartDate())
                .endDate(reg.getEndDate())
                .reason(reg.getReason())
                .status(reg.getStatus())
                .adminNote(reg.getNote())
                .build());
    }

    private void validatePermission(TemporaryRegistration reg) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            // 1. Lấy thông tin người dùng hiện tại
            String email = auth.getName();
            UserAccount currentUser = userAccountRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

            Resident currentResident = currentUser.getResident();
            if (currentResident == null || currentResident.getApartment() == null) {
                throw new RuntimeException("Tài khoản chưa liên kết căn hộ");
            }

            // 2. CHECK: Có đúng là đơn của nhà mình không?
            Integer userHouseId = currentResident.getApartment().getHouseid();
            if (!reg.getApartment().getHouseid().equals(userHouseId)) {
                throw new RuntimeException("Bạn không có quyền thao tác trên đơn của căn hộ khác!");
            }

            // 3. CHECK: Trạng thái có phải PENDING không?
            if (reg.getStatus() != RegistrationStatus.PENDING) {
                throw new RuntimeException("Không thể sửa/xóa đơn đã được Xử lý (Duyệt/Từ chối)!");
            }
        }
    }

    @Transactional
    public TemporaryRegistration updateRequest(Integer id, RegistrationRequest req) {
        TemporaryRegistration reg = registrationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Đơn đăng ký không tồn tại"));

        // 1. Kiểm tra quyền
        validatePermission(reg);

        // 2. Cập nhật thông tin (Chỉ cho sửa ngày, lý do, loại)
        // Không cho sửa Resident hoặc Apartment để tránh lỗi logic phức tạp
        reg.setType(req.getType());
        reg.setStartDate(req.getStartDate());
        reg.setEndDate(req.getEndDate());
        reg.setReason(req.getReason());

        return registrationRepository.save(reg);
    }

    // --- CHỨC NĂNG XÓA ---
    @Transactional
    public void deleteRequest(Integer id) {
        TemporaryRegistration reg = registrationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Đơn đăng ký không tồn tại"));

        // 1. Kiểm tra quyền
        validatePermission(reg);

        // 2. Xóa
        registrationRepository.delete(reg);
    }
}
