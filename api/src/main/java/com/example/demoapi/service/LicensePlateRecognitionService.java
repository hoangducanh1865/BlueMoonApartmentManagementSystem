package com.example.demoapi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class LicensePlateRecognitionService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${lpr.api.url:http://localhost:5001}")
    private String lprApiUrl;

    /**
     * Recognize license plate from base64 encoded image
     */
    public LicensePlateResult recognizeFromBase64(String base64Image) {
        try {
            String url = lprApiUrl + "/api/recognize";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("image", base64Image);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                return parseResponse(response.getBody());
            }

            log.error("LP Recognition API returned status: {}", response.getStatusCode());
            return LicensePlateResult.error("API returned status: " + response.getStatusCode());

        } catch (Exception e) {
            log.error("Error calling LP Recognition API", e);
            return LicensePlateResult.error("Error: " + e.getMessage());
        }
    }

    /**
     * Recognize license plate from image URL
     */
    public LicensePlateResult recognizeFromUrl(String imageUrl) {
        try {
            String url = lprApiUrl + "/api/recognize/url";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("url", imageUrl);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                return parseResponse(response.getBody());
            }

            log.error("LP Recognition API returned status: {}", response.getStatusCode());
            return LicensePlateResult.error("API returned status: " + response.getStatusCode());

        } catch (Exception e) {
            log.error("Error calling LP Recognition API", e);
            return LicensePlateResult.error("Error: " + e.getMessage());
        }
    }

    /**
     * Recognize license plate from uploaded file
     */
    public LicensePlateResult recognizeFromFile(MultipartFile file) {
        try {
            // Convert file to base64
            byte[] bytes = file.getBytes();
            String base64Image = Base64.getEncoder().encodeToString(bytes);
            return recognizeFromBase64(base64Image);

        } catch (Exception e) {
            log.error("Error processing file for LP Recognition", e);
            return LicensePlateResult.error("Error: " + e.getMessage());
        }
    }

    /**
     * Check if LP Recognition service is healthy
     */
    public boolean isServiceHealthy() {
        try {
            String url = lprApiUrl + "/health";
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            log.warn("LP Recognition service health check failed", e);
            return false;
        }
    }

    private LicensePlateResult parseResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);

            boolean success = root.path("success").asBoolean(false);
            if (!success) {
                String error = root.path("error").asText("Unknown error");
                return LicensePlateResult.error(error);
            }

            List<DetectedPlate> plates = new ArrayList<>();
            JsonNode platesNode = root.path("plates");

            if (platesNode.isArray()) {
                for (JsonNode plateNode : platesNode) {
                    String licensePlate = plateNode.path("licensePlate").asText();
                    double confidence = plateNode.path("confidence").asDouble(0);

                    BoundingBox bbox = null;
                    JsonNode bboxNode = plateNode.path("bbox");
                    if (!bboxNode.isNull() && !bboxNode.isMissingNode()) {
                        bbox = new BoundingBox(
                                bboxNode.path("xMin").asInt(),
                                bboxNode.path("yMin").asInt(),
                                bboxNode.path("xMax").asInt(),
                                bboxNode.path("yMax").asInt()
                        );
                    }

                    plates.add(new DetectedPlate(licensePlate, confidence, bbox));
                }
            }

            return LicensePlateResult.success(plates);

        } catch (Exception e) {
            log.error("Error parsing LP Recognition response", e);
            return LicensePlateResult.error("Error parsing response: " + e.getMessage());
        }
    }

    // Inner classes for result representation
    public static class LicensePlateResult {

        private final boolean success;
        private final String error;
        private final List<DetectedPlate> plates;

        private LicensePlateResult(boolean success, String error, List<DetectedPlate> plates) {
            this.success = success;
            this.error = error;
            this.plates = plates;
        }

        public static LicensePlateResult success(List<DetectedPlate> plates) {
            return new LicensePlateResult(true, null, plates);
        }

        public static LicensePlateResult error(String error) {
            return new LicensePlateResult(false, error, Collections.emptyList());
        }

        public boolean isSuccess() {
            return success;
        }

        public String getError() {
            return error;
        }

        public List<DetectedPlate> getPlates() {
            return plates;
        }

        public Optional<String> getFirstPlate() {
            if (plates != null && !plates.isEmpty()) {
                return Optional.of(plates.get(0).getLicensePlate());
            }
            return Optional.empty();
        }
    }

    public static class DetectedPlate {

        private final String licensePlate;
        private final double confidence;
        private final BoundingBox bbox;

        public DetectedPlate(String licensePlate, double confidence, BoundingBox bbox) {
            this.licensePlate = licensePlate;
            this.confidence = confidence;
            this.bbox = bbox;
        }

        public String getLicensePlate() {
            return licensePlate;
        }

        public double getConfidence() {
            return confidence;
        }

        public BoundingBox getBbox() {
            return bbox;
        }
    }

    public static class BoundingBox {

        private final int xMin;
        private final int yMin;
        private final int xMax;
        private final int yMax;

        public BoundingBox(int xMin, int yMin, int xMax, int yMax) {
            this.xMin = xMin;
            this.yMin = yMin;
            this.xMax = xMax;
            this.yMax = yMax;
        }

        public int getXMin() {
            return xMin;
        }

        public int getYMin() {
            return yMin;
        }

        public int getXMax() {
            return xMax;
        }

        public int getYMax() {
            return yMax;
        }
    }
}
