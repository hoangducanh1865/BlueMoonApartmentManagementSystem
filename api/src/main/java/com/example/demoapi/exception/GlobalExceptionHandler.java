package com.example.demoapi.exception; // Tạo package này

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice // Annotation này biến class thành nơi xử lý lỗi toàn cục
public class GlobalExceptionHandler {

    // Bắt tất cả RuntimeException (Lỗi mà bạn throw new RuntimeException(...) trong Service)
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Object> handleRuntimeException(RuntimeException e) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", 400);
        body.put("error", "Bad Request");
        body.put("message", e.getMessage()); // Lấy câu thông báo lỗi bạn viết trong Service

        return ResponseEntity.badRequest().body(body);
    }

    // (Tùy chọn) Bắt lỗi chung chung khác
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleGeneralException(Exception e) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", 500);
        body.put("error", "Internal Server Error");
        body.put("message", "Lỗi hệ thống không xác định: " + e.getMessage());

        return ResponseEntity.internalServerError().body(body);
    }
}