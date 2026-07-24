"""
License Plate Recognition API Service
This Flask API provides license plate detection and recognition endpoints
that can be integrated with the Spring Boot parking management system.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import cv2
import torch
import numpy as np
import base64
import io
import os
import sys

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import function.utils_rotate as utils_rotate
import function.helper as helper

app = Flask(__name__)
CORS(app)

# Load models once at startup
print("Loading LP detection model...")
yolo_LP_detect = torch.hub.load(
    "yolov5", "custom", path="model/LP_detector.pt", force_reload=True, source="local"
)

print("Loading LP OCR model...")
yolo_license_plate = torch.hub.load(
    "yolov5", "custom", path="model/LP_ocr.pt", force_reload=True, source="local"
)
yolo_license_plate.conf = 0.60

print("Models loaded successfully!")


def decode_base64_image(base64_string):
    """Decode base64 string to OpenCV image"""
    # Remove header if present
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]

    img_bytes = base64.b64decode(base64_string)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    return img


def recognize_plate(img):
    """
    Detect and recognize license plate from image
    Returns list of detected plates with coordinates
    """
    results = []

    # Detect plates
    plates = yolo_LP_detect(img, size=640)
    list_plates = plates.pandas().xyxy[0].values.tolist()

    if len(list_plates) == 0:
        # Try to read directly if no plate detected
        lp = helper.read_plate(yolo_license_plate, img)
        if lp != "unknown":
            results.append({"licensePlate": lp, "confidence": 0.5, "bbox": None})
    else:
        for plate in list_plates:
            x_min = int(plate[0])
            y_min = int(plate[1])
            x_max = int(plate[2])
            y_max = int(plate[3])
            confidence = float(plate[4])

            # Crop plate region
            crop_img = img[y_min:y_max, x_min:x_max]

            # Try different rotations to read plate
            lp = "unknown"
            for cc in range(0, 2):
                for ct in range(0, 2):
                    lp = helper.read_plate(
                        yolo_license_plate, utils_rotate.deskew(crop_img, cc, ct)
                    )
                    if lp != "unknown":
                        break
                if lp != "unknown":
                    break

            if lp != "unknown":
                results.append(
                    {
                        "licensePlate": lp,
                        "confidence": confidence,
                        "bbox": {
                            "xMin": x_min,
                            "yMin": y_min,
                            "xMax": x_max,
                            "yMax": y_max,
                        },
                    }
                )

    return results


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "license-plate-recognition"})


@app.route("/api/recognize", methods=["POST"])
def recognize():
    """
    Recognize license plate from uploaded image

    Request body (JSON):
    - image: base64 encoded image string

    OR multipart/form-data:
    - image: image file

    Response:
    {
        "success": true,
        "plates": [
            {
                "licensePlate": "29A-12345",
                "confidence": 0.95,
                "bbox": {"xMin": 100, "yMin": 200, "xMax": 300, "yMax": 280}
            }
        ]
    }
    """
    try:
        img = None

        # Check if JSON request with base64 image
        if request.is_json:
            data = request.get_json()
            if "image" in data:
                img = decode_base64_image(data["image"])

        # Check if file upload
        elif "image" in request.files:
            file = request.files["image"]
            img_bytes = file.read()
            img_array = np.frombuffer(img_bytes, dtype=np.uint8)
            img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if img is None:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "No image provided. Send base64 image in JSON or upload file.",
                    }
                ),
                400,
            )

        # Recognize plates
        plates = recognize_plate(img)

        return jsonify({"success": True, "plates": plates, "count": len(plates)})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/recognize/url", methods=["POST"])
def recognize_from_url():
    """
    Recognize license plate from image URL

    Request body (JSON):
    - url: URL of the image

    Response: Same as /api/recognize
    """
    try:
        data = request.get_json()
        if "url" not in data:
            return jsonify({"success": False, "error": "No URL provided"}), 400

        import urllib.request

        # Download image from URL
        url = data["url"]
        resp = urllib.request.urlopen(url)
        img_array = np.asarray(bytearray(resp.read()), dtype=np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if img is None:
            return (
                jsonify({"success": False, "error": "Could not load image from URL"}),
                400,
            )

        # Recognize plates
        plates = recognize_plate(img)

        return jsonify({"success": True, "plates": plates, "count": len(plates)})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    print("Starting License Plate Recognition API...")
    print("Endpoints:")
    print("  - GET  /health          - Health check")
    print(
        "  - POST /api/recognize   - Recognize plate from image (base64 or file upload)"
    )
    print("  - POST /api/recognize/url - Recognize plate from image URL")
    app.run(host="0.0.0.0", port=5001, debug=False)
