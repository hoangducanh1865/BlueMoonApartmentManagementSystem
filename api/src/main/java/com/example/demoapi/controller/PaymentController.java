package com.example.demoapi.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demoapi.dto.request.SimulatePaymentRequest;
import com.example.demoapi.model.Payment;
import com.example.demoapi.service.PaymentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/simulate")
    public ResponseEntity<?> simulatePayment(@RequestBody SimulatePaymentRequest request) {
        // Lấy email người dùng đang đăng nhập để check quyền sở hữu
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = auth.getName();

        try {
            Payment payment = paymentService.simulatePayment(request, currentEmail);
            return ResponseEntity.ok("Thanh toán giả lập thành công! Mã GD: " + payment.getOnlinetransactionid());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
