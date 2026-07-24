package com.example.demoapi.service;

import com.example.demoapi.dto.request.HouseholdRequest;
import com.example.demoapi.dto.request.MemberRequest;
import com.example.demoapi.dto.request.UpdateMemberRequest;
import com.example.demoapi.dto.response.HouseholdResponse;
import com.example.demoapi.dto.response.ResidentResponse;
import com.example.demoapi.model.*;
import com.example.demoapi.repository.ApartmentRepository;
import com.example.demoapi.repository.InvoiceRepository;
import com.example.demoapi.repository.ResidentRepository;
import com.example.demoapi.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class HouseholdService {

    private final ApartmentRepository apartmentRepository;
    private final ResidentRepository residentRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserAccountRepository userAccountRepository;

    public List<HouseholdResponse> getHouseholds(String search) {
        return apartmentRepository.findHouseholdsByKeyword(search);
    }

    public HouseholdResponse getHouseholdById(Integer id) {
        return apartmentRepository.findHouseholdDetailById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hộ khẩu với ID: " + id));
    }

    @Transactional
    public HouseholdResponse createHousehold(HouseholdRequest request) {

        // 1. Kiểm tra trùng số phòng (Vẫn phải check cái này)
        if (apartmentRepository.existsByApartmentNumber(request.getRoomNumber())) {
            throw new RuntimeException("Căn hộ " + request.getRoomNumber() + " đã tồn tại!");
        }

        // 2. Tạo và Lưu Căn Hộ
        Apartment apartment = new Apartment();
        apartment.setApartmentNumber(request.getRoomNumber());
        apartment.setArea(request.getArea());

        // Map các trường mới từ DTO
        apartment.setBuilding(request.getBuilding());
        apartment.setFloor(request.getFloor());
        apartment.setStatus(request.getStatus() != null ? request.getStatus() : ApartmentStatus.OCCUPIED);
        apartment.setType(request.getType() != null ? request.getType() : ApartmentType.NORMAL);

        Apartment savedApartment = apartmentRepository.save(apartment);

        // 3. Xử lý Chủ Hộ (Logic: Nếu tồn tại thì tái sử dụng thông tin, nhưng tạo row mới)
        Resident owner = new Resident();

        // Tìm xem ông chủ này (dựa theo SĐT) đã có trong hệ thống chưa (VD: Đang sở hữu nhà khác)
        Optional<Resident> existingOwner = residentRepository.findFirstByPhonenumber(request.getPhoneNumber());

        if (existingOwner.isPresent()) {
            // CASE: Đã tồn tại -> Copy thông tin cá nhân từ hồ sơ cũ sang hồ sơ mới
            Resident oldProfile = existingOwner.get();
            owner.setName(oldProfile.getName()); // Giữ tên cũ cho chuẩn
            owner.setDob(oldProfile.getDob());
            owner.setCccd(oldProfile.getCccd());
            owner.setAddress(oldProfile.getAddress());
            owner.setEmail(oldProfile.getEmail());
            owner.setAvatar(oldProfile.getAvatar());
            // Ghi chú là người này sở hữu nhiều nhà
            owner.setNote("Đồng sở hữu căn hộ: " + oldProfile.getApartment().getApartmentNumber());
        } else {
            // CASE: Chủ hộ mới tinh -> Lấy từ Request
            owner.setName(request.getOwnerName());
            owner.setEmail(request.getEmail());
            // Các trường khác (DOB, CCCD) có thể null hoặc update sau
        }

        // Set các thông tin bắt buộc cho bản ghi mới này
        owner.setPhonenumber(request.getPhoneNumber()); // Key để định danh
        owner.setApartment(savedApartment);
        owner.setIsHost(true);
        owner.setRelationship("Chủ hộ");
        owner.setState(ResidentStatus.THUONG_TRU);
        owner.setStartDate(LocalDate.now());

        residentRepository.save(owner);

        // 4. Trả về Response
        return HouseholdResponse.builder()
                .id(savedApartment.getHouseid())
                .roomNumber(savedApartment.getApartmentNumber())
                .ownerName(owner.getName())
                .area(savedApartment.getArea())
                .memberCount(1L)
                .phoneNumber(owner.getPhonenumber())
                .building(savedApartment.getBuilding())
                .status(savedApartment.getStatus())
                .build();
    }

    @Transactional
    public HouseholdResponse updateHousehold(Integer id, HouseholdRequest request) {
        // 1. Tìm căn hộ cần sửa
        Apartment apartment = apartmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy căn hộ với ID: " + id));

        // 2. Validate Số phòng (Nếu có thay đổi số phòng)
        if (!apartment.getApartmentNumber().equals(request.getRoomNumber())
                && apartmentRepository.existsByApartmentNumber(request.getRoomNumber())) {
            throw new RuntimeException("Số phòng " + request.getRoomNumber() + " đã được sử dụng bởi căn hộ khác!");
        }

        // 3. Cập nhật thông tin Căn hộ
        apartment.setApartmentNumber(request.getRoomNumber());
        apartment.setArea(request.getArea());
        if (request.getBuilding() != null) apartment.setBuilding(request.getBuilding());
        if (request.getFloor() != null) apartment.setFloor(request.getFloor());
        if (request.getStatus() != null) apartment.setStatus(request.getStatus());
        if (request.getType() != null) apartment.setType(request.getType());

        Apartment savedApartment = apartmentRepository.save(apartment);

        // 4. Cập nhật thông tin Chủ hộ
        // Tìm ông chủ hiện tại của nhà này
        Resident owner = residentRepository.findByApartment_HouseidAndIsHostTrue(id)
                .orElseThrow(() -> new RuntimeException("Dữ liệu lỗi: Căn hộ này chưa có chủ hộ!"));

        // Cập nhật thông tin cá nhân chủ hộ
        owner.setName(request.getOwnerName());
        owner.setPhonenumber(request.getPhoneNumber());
        if (request.getEmail() != null) owner.setEmail(request.getEmail());

        // Lưu lại
        residentRepository.save(owner);

        // (Tùy chọn) Tính lại số lượng thành viên
         Long memberCount = residentRepository.countByApartment_Houseid(id);

        // 5. Trả về kết quả
        return HouseholdResponse.builder()
                .id(savedApartment.getHouseid())
                .roomNumber(savedApartment.getApartmentNumber())
                .ownerName(owner.getName())
                .area(savedApartment.getArea())
                .phoneNumber(owner.getPhonenumber())
                .memberCount(memberCount)
                .building(savedApartment.getBuilding())
                .status(savedApartment.getStatus())
                .build();
    }

    @Transactional
    public void deleteHousehold(Integer id) {
        // 1. Tìm căn hộ
        Apartment apartment = apartmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Căn hộ không tồn tại"));

        // 2. CHECK AN TOÀN: Nếu đã có hóa đơn/giao dịch -> KHÔNG ĐƯỢC XÓA
        if (invoiceRepository.existsByHouseid_Houseid(id)) {
            throw new RuntimeException("Không thể xóa căn hộ này vì đã phát sinh dữ liệu hóa đơn/tài chính! Hãy chuyển trạng thái sang 'Trống' thay vì xóa.");
        }

        // 3. Lấy danh sách cư dân trong nhà
        List<Resident> residents = residentRepository.findByApartment_Houseid(id);

        for (Resident resident : residents) {
            // 3.1. Xóa tài khoản User liên quan (Nếu có)
            if (userAccountRepository.existsByResident(resident)) {
                userAccountRepository.deleteByResident_Residentid(resident.getResidentid());
            }

            // 3.2. Xóa Cư dân (Hoặc chuyển trạng thái nếu muốn lưu vết)
            // Ở đây tôi làm theo yêu cầu của bạn là XÓA LUÔN
            residentRepository.delete(resident);
        }

        // 4. Xóa Căn hộ
        apartmentRepository.delete(apartment);
    }

    public List<ResidentResponse> getHouseholdMembers(Integer householdId) {
        // 1. Kiểm tra hộ khẩu có tồn tại không (Optional)
        if (!apartmentRepository.existsById(householdId)) {
            throw new RuntimeException("Hộ khẩu không tồn tại!");
        }

        // 2. Lấy danh sách Entity
        List<Resident> residents = residentRepository.findByApartment_Houseid(householdId);

        // 3. Convert sang DTO Response
        return residents.stream()
                .map(resident -> ResidentResponse.builder()
                        .id(resident.getResidentid())
                        .name(resident.getName())
                        .dob(resident.getDob())
                        .phoneNumber(resident.getPhonenumber())
                        .email(resident.getEmail())
                        .relationship(resident.getRelationship())
                        .isHost(resident.getIsHost())
                        .status(resident.getState())
                        .cccd(resident.getCccd())
                        .build())
                .toList();
    }

    @Transactional
    public ResidentResponse addMemberToHousehold(Integer householdId, MemberRequest request) {
        // 1. Tìm căn hộ
        Apartment apartment = apartmentRepository.findById(householdId)
                .orElseThrow(() -> new RuntimeException("Căn hộ không tồn tại!"));

        // 2. Logic tái sử dụng hồ sơ (Nếu người này đã có trong hệ thống)
        // Dựa vào SĐT để check xem người này đã tồn tại chưa
        Resident newMember = new Resident();
        Optional<Resident> existingProfile = residentRepository.findFirstByPhonenumber(request.getPhoneNumber());

        if (existingProfile.isPresent()) {
            // Nếu đã tồn tại -> Copy thông tin cá nhân gốc sang
            Resident old = existingProfile.get();
            newMember.setName(old.getName());
            newMember.setDob(old.getDob());
            newMember.setCccd(old.getCccd());
            newMember.setAddress(old.getAddress());
            newMember.setEmail(old.getEmail());
            newMember.setAvatar(old.getAvatar());
        } else {
            // Nếu là người mới tinh -> Lấy từ Request
            newMember.setName(request.getName());
            newMember.setDob(request.getDob());
            newMember.setCccd(request.getCccd());
            newMember.setEmail(request.getEmail());
            newMember.setAvatar(request.getAvatar());
        }

        // 3. Thiết lập thông tin cư trú cho căn hộ này
        newMember.setPhonenumber(request.getPhoneNumber());
        newMember.setApartment(apartment); // Gán vào nhà
        newMember.setIsHost(false);        // Thành viên (Không phải chủ hộ)
        newMember.setRelationship(request.getRelationship()); // Vợ/Con...

        // Mặc định là Thường trú nếu không gửi status
        newMember.setState(request.getStatus() != null ? request.getStatus() : ResidentStatus.THUONG_TRU);

        newMember.setStartDate(LocalDate.now()); // Ngày bắt đầu ở
        newMember.setNote(request.getNote());

        // 4. Lưu vào DB
        Resident savedMember = residentRepository.save(newMember);

        // 5. Trả về Response
        return ResidentResponse.builder()
                .id(savedMember.getResidentid())
                .name(savedMember.getName())
                .dob(savedMember.getDob())
                .phoneNumber(savedMember.getPhonenumber())
                .relationship(savedMember.getRelationship())
                .isHost(false)
                .status(savedMember.getState())
                .cccd(savedMember.getCccd())
                .build();
    }

    @Transactional
    public ResidentResponse updateMember(Integer memberId, UpdateMemberRequest request) {
        // 1. Tìm thành viên cần sửa
        Resident resident = residentRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Cư dân không tồn tại!"));

        // 2. Xác định Căn hộ đích (Target Apartment)
        // (Để biết là đang tranh chức chủ hộ của nhà cũ hay nhà mới)
        Apartment targetApartment = resident.getApartment(); // Mặc định là nhà hiện tại

        if (request.getNewRoomNumber() != null && !request.getNewRoomNumber().isEmpty()) {
            String currentRoom = resident.getApartment().getApartmentNumber();
            if (!currentRoom.equals(request.getNewRoomNumber())) {
                targetApartment = apartmentRepository.findByApartmentNumber(request.getNewRoomNumber())
                        .orElseThrow(() -> new RuntimeException("Căn hộ mới không tồn tại!"));
            }
        }

        // 3. --- LOGIC QUAN TRỌNG: XỬ LÝ CHỦ HỘ (Host Handling) ---
        if (Boolean.TRUE.equals(request.getIsHost())) {
            // Nếu yêu cầu set người này làm chủ hộ

            // Tìm xem căn nhà đích hiện tại ai đang làm chủ?
            Optional<Resident> currentHostOpt = residentRepository.findByApartment_HouseidAndIsHostTrue(targetApartment.getHouseid());

            if (currentHostOpt.isPresent()) {
                Resident currentHost = currentHostOpt.get();

                // Chỉ xử lý nếu chủ hộ cũ KHÔNG PHẢI là người đang được sửa
                if (!currentHost.getResidentid().equals(resident.getResidentid())) {
                    // "Giáng chức" chủ hộ cũ
                    currentHost.setIsHost(false);
                    // Đổi quan hệ thành 'Thành viên' hoặc giữ nguyên tùy nghiệp vụ
                    if ("Chủ hộ".equals(currentHost.getRelationship())) {
                        currentHost.setRelationship("Thành viên");
                    }
                    residentRepository.save(currentHost);
                }
            }

            // Set người này làm chủ hộ
            resident.setIsHost(true);
            resident.setRelationship("Chủ hộ"); // Tự động sửa relationship cho hợp lý
        } else if (Boolean.FALSE.equals(request.getIsHost())) {
            // Nếu user chủ động set isHost = false -> Chấp nhận luôn
            resident.setIsHost(false);
        }

        // 4. Cập nhật các thông tin cá nhân khác
        if (request.getName() != null) resident.setName(request.getName());
        if (request.getPhoneNumber() != null) resident.setPhonenumber(request.getPhoneNumber());
        if (request.getEmail() != null) resident.setEmail(request.getEmail());
        if (request.getDob() != null) resident.setDob(request.getDob());
        if (request.getCccd() != null) resident.setCccd(request.getCccd());
        if (request.getAvatar() != null) resident.setAvatar(request.getAvatar());
        if (request.getNote() != null) resident.setNote(request.getNote());

        if (request.getStatus() != null) resident.setState(request.getStatus());
        // Nếu user gửi relationship riêng thì ghi đè, còn không thì giữ logic ở bước 3
        if (request.getRelationship() != null && !Boolean.TRUE.equals(request.getIsHost())) {
            resident.setRelationship(request.getRelationship());
        }

        // 5. Gán vào căn hộ (Nếu có thay đổi nhà)
        if (!resident.getApartment().getHouseid().equals(targetApartment.getHouseid())) {
            resident.setApartment(targetApartment);
            resident.setStartDate(LocalDate.now()); // Reset ngày vào ở
        }

        // 6. Lưu và Trả về
        Resident savedMember = residentRepository.save(resident);

        return ResidentResponse.builder()
                .id(savedMember.getResidentid())
                .name(savedMember.getName())
                .dob(savedMember.getDob())
                .phoneNumber(savedMember.getPhonenumber())
                .relationship(savedMember.getRelationship())
                .isHost(savedMember.getIsHost())
                .status(savedMember.getState())
                .cccd(savedMember.getCccd())
                .build();
    }
    public Page<ResidentResponse> getAllResidents(String keyword, Pageable pageable) {
        // 1. Gọi Repo lấy danh sách Entity có phân trang
        Page<Resident> residentPage = residentRepository.findAllResidents(keyword, pageable);

        // 2. Map từ Entity sang DTO
        return residentPage.map(resident -> ResidentResponse.builder()
                .id(resident.getResidentid())
                .name(resident.getName())
                .dob(resident.getDob())
                .phoneNumber(resident.getPhonenumber())
                .email(resident.getEmail())
                .relationship(resident.getRelationship())
                .isHost(resident.getIsHost())
                .status(resident.getState())
                .cccd(resident.getCccd())
                // Map thêm thông tin phòng
                .roomNumber(resident.getApartment() != null ? resident.getApartment().getApartmentNumber() : "N/A")
                .building(resident.getApartment() != null ? resident.getApartment().getBuilding() : "N/A")
                .build());
    }

    @Transactional
    public void deleteResident(Integer residentId) {
        // 1. Tìm cư dân
        Resident resident = residentRepository.findById(residentId)
                .orElseThrow(() -> new RuntimeException("Cư dân không tồn tại!"));

        // 2. LOGIC KIỂM TRA NỢ (Chỉ áp dụng nếu là CHỦ HỘ)
        if (Boolean.TRUE.equals(resident.getIsHost())) {
            Integer houseId = resident.getApartment().getHouseid();

            // Check trong bảng Invoice
            boolean hasDebt = invoiceRepository.existsUnpaidInvoiceByHouseId(houseId);

            if (hasDebt) {
                throw new RuntimeException("KHÔNG THỂ XÓA: Căn hộ của chủ hộ này đang còn dư nợ chưa thanh toán!");
            }
        }

        // 3. Xóa tài khoản User liên kết (Nếu có)
        // (Để tránh lỗi khóa ngoại hoặc user 'mồ côi')
        if (userAccountRepository.existsByResident(resident)) {
            userAccountRepository.deleteByResident(resident);
        }

        // 4. Xóa cư dân
        residentRepository.delete(resident);
    }
}