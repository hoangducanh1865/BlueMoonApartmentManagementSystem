package com.example.demoapi.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class FeeRequest {

    @NotBlank(message = "Tên loại phí không được để trống")
    private String feeName;

    private String description;

    @NotNull(message = "Đơn giá không được để trống")
    @Min(value = 0, message = "Đơn giá phải lớn hơn hoặc bằng 0")
    private BigDecimal unitPrice;

    @NotBlank(message = "Đơn vị tính không được để trống (VD: kWh, m3, tháng)")
    private String unit;

    private String billingCycle; // VD: "Hàng tháng", "Một lần"

    @NotNull(message = "Phải xác định đây là phí bắt buộc hay không")
    private Boolean isMandatory;
}