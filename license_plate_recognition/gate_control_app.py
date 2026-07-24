"""
Gate Control Application - AI-Powered Parking Gate Management
=====================================================
A1: FastAPI + OpenCV Web Interface
A2: Webcam, YOLO Detection, OCR Display
A3: Backend Communication (Spring Boot API)
A4: Manual Override Buttons for Guards

This application provides a web-based gate control interface with:
- Real-time webcam feed with license plate detection
- Automatic license plate recognition using YOLOv5
- Integration with the apartment management backend
- Manual override controls for security guards
"""

import os
import sys
import cv2
import base64
import asyncio
import httpx
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager
import threading
import queue

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

# Add parent directory to path for YOLOv5 imports
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))
sys.path.insert(0, str(SCRIPT_DIR / "yolov5"))

import torch
from function.utils_rotate import deskew
from function.helper import read_plate

# ============ Configuration ============
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:8080/api")
BACKEND_AUTH_TOKEN = os.getenv("BACKEND_AUTH_TOKEN", "")  # JWT token if needed
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@bluemoon.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "123456")
LP_DETECTOR_MODEL = SCRIPT_DIR / "model" / "LP_detector.pt"
LP_OCR_MODEL = SCRIPT_DIR / "model" / "LP_ocr.pt"
CAMERA_INDEX = int(os.getenv("CAMERA_INDEX", "0"))
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.5"))

# ============ Global State ============
camera_lock = threading.Lock()
latest_frame: Optional[np.ndarray] = None
latest_detection: Optional[Dict[str, Any]] = None
detection_queue: queue.Queue = queue.Queue(maxsize=10)
websocket_clients: List[WebSocket] = []

# ============ Models ============
detector_model = None
ocr_model = None


def load_models():
    """Load YOLO models for license plate detection and OCR"""
    global detector_model, ocr_model

    print("Loading license plate detector model...")
    detector_model = torch.hub.load(
        str(SCRIPT_DIR / "yolov5"),
        "custom",
        path=str(LP_DETECTOR_MODEL),
        source="local",
        force_reload=False,
    )
    detector_model.conf = CONFIDENCE_THRESHOLD

    print("Loading OCR model...")
    ocr_model = torch.hub.load(
        str(SCRIPT_DIR / "yolov5"),
        "custom",
        path=str(LP_OCR_MODEL),
        source="local",
        force_reload=False,
    )

    print("Models loaded successfully!")


class ConnectionManager:
    """Manage WebSocket connections"""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass


manager = ConnectionManager()


# ============ Camera Processing ============
class CameraProcessor:
    """Process camera frames and detect license plates"""

    def __init__(self, camera_index: int = 0):
        self.camera_index = camera_index
        self.cap: Optional[cv2.VideoCapture] = None
        self.running = False
        self.thread: Optional[threading.Thread] = None

    def start(self):
        """Start the camera capture thread"""
        if self.running:
            return

        self.cap = cv2.VideoCapture(self.camera_index)
        if not self.cap.isOpened():
            print(f"Warning: Could not open camera {self.camera_index}")
            return

        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        self.cap.set(cv2.CAP_PROP_FPS, 30)

        self.running = True
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()
        print(f"Camera {self.camera_index} started")

    def stop(self):
        """Stop the camera capture"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=2.0)
        if self.cap:
            self.cap.release()
        print("Camera stopped")

    def _capture_loop(self):
        """Main capture loop running in a separate thread"""
        global latest_frame, latest_detection

        while self.running:
            ret, frame = self.cap.read()
            if not ret:
                continue

            with camera_lock:
                latest_frame = frame.copy()

            # Process every 5th frame for detection
            if int(datetime.now().timestamp() * 10) % 5 == 0:
                detection = self._detect_license_plate(frame)
                if detection:
                    latest_detection = detection
                    try:
                        detection_queue.put_nowait(detection)
                    except queue.Full:
                        pass

    def _detect_license_plate(self, frame: np.ndarray) -> Optional[Dict[str, Any]]:
        """Detect and read license plate from frame"""
        global detector_model, ocr_model

        if detector_model is None or ocr_model is None:
            return None

        try:
            # Detect license plates
            results = detector_model(frame)
            plates_data = results.pandas().xyxy[0]

            detected_plates = []
            annotated_frame = frame.copy()

            for idx, plate in plates_data.iterrows():
                x1, y1, x2, y2 = (
                    int(plate["xmin"]),
                    int(plate["ymin"]),
                    int(plate["xmax"]),
                    int(plate["ymax"]),
                )
                conf = plate["confidence"]

                # Crop plate region
                plate_crop = frame[y1:y2, x1:x2]

                if plate_crop.size == 0:
                    continue

                # Deskew the plate
                try:
                    plate_crop = deskew(plate_crop, (0, 18, 60, 0))
                except:
                    pass

                # OCR the plate
                plate_text = read_plate(ocr_model, plate_crop)

                if plate_text:
                    detected_plates.append(
                        {
                            "plate": plate_text,
                            "confidence": float(conf),
                            "bbox": [x1, y1, x2, y2],
                        }
                    )

                    # Draw on frame
                    cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 255, 0), 3)
                    cv2.putText(
                        annotated_frame,
                        plate_text,
                        (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        1.2,
                        (0, 255, 0),
                        3,
                    )

            if detected_plates:
                return {
                    "timestamp": datetime.now().isoformat(),
                    "plates": detected_plates,
                    "frame": annotated_frame,
                }

            return None

        except Exception as e:
            print(f"Detection error: {e}")
            return None

    def get_current_frame(self) -> Optional[np.ndarray]:
        """Get the latest captured frame"""
        with camera_lock:
            return latest_frame.copy() if latest_frame is not None else None

    def capture_and_detect(self) -> Optional[Dict[str, Any]]:
        """Force capture and detection on current frame"""
        with camera_lock:
            if latest_frame is None:
                return None
            frame = latest_frame.copy()

        return self._detect_license_plate(frame)


camera_processor = CameraProcessor(CAMERA_INDEX)


# ============ Backend API Client ============
class BackendClient:
    """Client for communicating with Spring Boot backend"""

    def __init__(self, base_url: str, auth_token: str = ""):
        self.base_url = base_url.rstrip("/")
        self.auth_token = auth_token

    def _get_headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers

    async def login(self, email: str, password: str) -> bool:
        """Login to backend to get JWT token"""
        async with httpx.AsyncClient() as client:
            try:
                payload = {"email": email, "password": password}
                response = await client.post(
                    f"{self.base_url}/auth/login",
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=10.0,
                )
                response.raise_for_status()
                data = response.json()
                if "token" in data:
                    self.auth_token = data["token"]
                    print(f"Successfully logged in as {email}")
                    return True
                else:
                    print("Login response did not contain token")
                    return False
            except Exception as e:
                print(f"Login failed: {e}")
                return False

    async def record_entry(
        self,
        license_plate: str,
        vehicle_type: str = "CAR",
        card_number: Optional[str] = None,
        notes: Optional[str] = None,
        image_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Record vehicle entry via parking-access API"""
        async with httpx.AsyncClient() as client:
            try:
                payload = {"licensePlate": license_plate, "vehicleType": vehicle_type}
                if card_number:
                    payload["cardNumber"] = card_number
                if notes:
                    payload["notes"] = notes
                if image_url:
                    payload["imageUrl"] = image_url

                print(f"Sending entry request for {license_plate}...")
                response = await client.post(
                    f"{self.base_url}/parking-access/entry",
                    json=payload,
                    headers=self._get_headers(),
                    timeout=10.0,
                )
                response.raise_for_status()
                return {"success": True, "data": response.json()}
            except httpx.HTTPStatusError as e:
                print(f"Entry failed: {e.response.status_code} - {e.response.text}")
                try:
                    error_data = e.response.json()
                    error_msg = error_data.get("message", str(error_data))
                except:
                    error_msg = e.response.text
                return {"success": False, "error": error_msg}
            except Exception as e:
                print(f"Entry error: {e}")
                return {"success": False, "error": str(e)}

    async def record_exit(
        self, license_plate: str, image_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Record vehicle exit via parking-access API"""
        async with httpx.AsyncClient() as client:
            try:
                payload = {"licensePlate": license_plate}
                if image_url:
                    payload["imageUrl"] = image_url

                print(f"Sending exit request for {license_plate}...")
                response = await client.post(
                    f"{self.base_url}/parking-access/exit",
                    json=payload,
                    headers=self._get_headers(),
                    timeout=10.0,
                )
                response.raise_for_status()
                return {"success": True, "data": response.json()}
            except httpx.HTTPStatusError as e:
                print(f"Exit failed: {e.response.status_code} - {e.response.text}")
                try:
                    error_data = e.response.json()
                    error_msg = error_data.get("message", str(error_data))
                except:
                    error_msg = e.response.text
                return {"success": False, "error": error_msg}
            except Exception as e:
                print(f"Exit error: {e}")
                return {"success": False, "error": str(e)}

    async def check_vehicle(self, license_plate: str) -> Dict[str, Any]:
        """Check vehicle status by license plate - returns registration & subscription info"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/parking-access/check/{license_plate}",
                    headers=self._get_headers(),
                    timeout=10.0,
                )
                response.raise_for_status()
                return {"success": True, "data": response.json()}
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404:
                    return {
                        "success": True,
                        "data": {"isRegistered": False, "licensePlate": license_plate},
                    }
                return {"success": False, "error": str(e.response.text)}
            except Exception as e:
                return {"success": False, "error": str(e)}

    async def get_vehicle_info(self, license_plate: str) -> Dict[str, Any]:
        """Get vehicle information by license plate"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/vehicles/plate/{license_plate}",
                    headers=self._get_headers(),
                    timeout=10.0,
                )
                response.raise_for_status()
                return {"success": True, "data": response.json()}
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404:
                    return {"success": False, "error": "Xe không có trong hệ thống"}
                return {"success": False, "error": str(e.response.text)}
            except Exception as e:
                return {"success": False, "error": str(e)}

    async def check_subscription(self, vehicle_id: int) -> Dict[str, Any]:
        """Check if vehicle has active subscription"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/parking-subscriptions/vehicle/{vehicle_id}/active",
                    headers=self._get_headers(),
                    timeout=10.0,
                )
                if response.status_code == 404:
                    return {"success": True, "data": None}
                response.raise_for_status()
                return {"success": True, "data": response.json()}
            except Exception as e:
                return {"success": False, "error": str(e)}


backend_client = BackendClient(BACKEND_API_URL, BACKEND_AUTH_TOKEN)


# ============ FastAPI Application ============
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    load_models()
    camera_processor.start()

    # Login to backend
    print(f"Attempting to login to backend at {BACKEND_API_URL}...")
    await backend_client.login(ADMIN_EMAIL, ADMIN_PASSWORD)

    yield
    # Shutdown
    camera_processor.stop()


app = FastAPI(
    title="Gate Control System",
    description="AI-Powered Parking Gate Management",
    version="1.0.0",
    lifespan=lifespan,
)


# ============ Pydantic Models ============
class ManualEntryRequest(BaseModel):
    license_plate: str
    entry_type: str = "MONTHLY"  # MONTHLY or VISITOR
    vehicle_type: str = "CAR"


class ManualExitRequest(BaseModel):
    license_plate: str


# ============ HTML Template ============
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gate Control System - Hệ thống điều khiển cổng</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .pulse-green { animation: pulse-green 2s infinite; }
        @keyframes pulse-green {
            0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
            50% { box-shadow: 0 0 0 15px rgba(34, 197, 94, 0); }
        }
        .pulse-orange { animation: pulse-orange 2s infinite; }
        @keyframes pulse-orange {
            0%, 100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7); }
            50% { box-shadow: 0 0 0 15px rgba(249, 115, 22, 0); }
        }
        .detection-flash { animation: flash 0.5s; }
        @keyframes flash {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    </style>
</head>
<body class="bg-gray-900 text-white min-h-screen">
    <div class="container mx-auto p-4">
        <!-- Header -->
        <header class="bg-gray-800 rounded-xl p-4 mb-4 flex justify-between items-center">
            <div class="flex items-center gap-4">
                <div class="p-3 bg-blue-600 rounded-xl">
                    <i class="fas fa-parking text-2xl"></i>
                </div>
                <div>
                    <h1 class="text-2xl font-bold">Gate Control System</h1>
                    <p class="text-gray-400 text-sm">Hệ thống điều khiển cổng tự động</p>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <div id="status-indicator" class="flex items-center gap-2 px-4 py-2 bg-green-900/50 rounded-lg">
                    <span class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                    <span class="text-green-400 font-medium">Camera đang hoạt động</span>
                </div>
                <div class="text-gray-400">
                    <span id="current-time"></span>
                </div>
            </div>
        </header>

        <div class="grid grid-cols-12 gap-4">
            <!-- Main Camera View -->
            <div class="col-span-8">
                <div class="bg-gray-800 rounded-xl overflow-hidden">
                    <div class="p-4 border-b border-gray-700 flex justify-between items-center">
                        <h2 class="font-bold text-lg flex items-center gap-2">
                            <i class="fas fa-video text-blue-400"></i>
                            Camera Feed
                        </h2>
                        <div class="flex items-center gap-2">
                            <button onclick="toggleAutoDetect()" id="auto-detect-btn" 
                                class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors">
                                <i class="fas fa-magic mr-2"></i>
                                Auto Detect: ON
                            </button>
                        </div>
                    </div>
                    <div class="relative aspect-video bg-black">
                        <img id="camera-feed" class="w-full h-full object-contain" 
                             src="/api/frame" alt="Camera Feed">
                        <div id="detection-overlay" class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 hidden">
                            <div class="flex items-center gap-4">
                                <div class="p-3 bg-green-600 rounded-xl">
                                    <i class="fas fa-car text-2xl"></i>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-400">Biển số phát hiện:</p>
                                    <p id="detected-plate" class="text-3xl font-bold font-mono text-green-400"></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Detection Log -->
                <div class="bg-gray-800 rounded-xl mt-4 overflow-hidden">
                    <div class="p-4 border-b border-gray-700 flex justify-between items-center">
                        <h2 class="font-bold text-lg flex items-center gap-2">
                            <i class="fas fa-history text-blue-400"></i>
                            Lịch sử phát hiện
                        </h2>
                        <button onclick="clearLog()" class="text-sm text-gray-400 hover:text-white">
                            <i class="fas fa-trash mr-1"></i> Xóa
                        </button>
                    </div>
                    <div id="detection-log" class="max-h-48 overflow-y-auto p-4 space-y-2">
                        <p class="text-gray-500 text-center py-4">Chưa có phát hiện nào</p>
                    </div>
                </div>
            </div>

            <!-- Control Panel -->
            <div class="col-span-4 space-y-4">
                <!-- Simulation Panel -->
                <div class="bg-gray-800 rounded-xl overflow-hidden border border-blue-500/30">
                    <div class="p-4 border-b border-gray-700 bg-blue-900/20">
                        <h2 class="font-bold text-lg flex items-center gap-2">
                            <i class="fas fa-id-card text-blue-400"></i>
                            Mô phỏng Quẹt thẻ
                        </h2>
                        <p class="text-sm text-gray-400 mt-1">Tự động chụp ảnh & nhận diện</p>
                    </div>
                    <div class="p-4 grid grid-cols-2 gap-3">
                        <button onclick="simulateSwipe('entry')" 
                            class="flex flex-col items-center justify-center p-4 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors group">
                            <i class="fas fa-sign-in-alt text-3xl mb-2 group-hover:scale-110 transition-transform"></i>
                            <span class="font-bold">QUẸT THẺ VÀO</span>
                        </button>
                        <button onclick="simulateSwipe('exit')" 
                            class="flex flex-col items-center justify-center p-4 bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors group">
                            <i class="fas fa-sign-out-alt text-3xl mb-2 group-hover:scale-110 transition-transform"></i>
                            <span class="font-bold">QUẸT THẺ RA</span>
                        </button>
                    </div>
                </div>

                <!-- Manual Override -->
                <div class="bg-gray-800 rounded-xl overflow-hidden">
                    <div class="p-4 border-b border-gray-700">
                        <h2 class="font-bold text-lg flex items-center gap-2">
                            <i class="fas fa-hand-paper text-yellow-400"></i>
                            Điều khiển thủ công
                        </h2>
                        <p class="text-sm text-gray-400 mt-1">Dành cho bảo vệ khi cần ghi nhận thủ công</p>
                    </div>
                    <div class="p-4 space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-2">Biển số xe</label>
                            <input type="text" id="manual-plate" placeholder="VD: 29A-12345"
                                class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-xl font-mono text-center uppercase focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onkeypress="handleManualInput(event)">
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <button onclick="manualEntry()" 
                                class="pulse-green flex flex-col items-center justify-center p-4 bg-green-600 hover:bg-green-700 rounded-xl transition-colors">
                                <i class="fas fa-arrow-down text-3xl mb-2"></i>
                                <span class="font-bold">XE VÀO</span>
                            </button>
                            <button onclick="manualExit()" 
                                class="pulse-orange flex flex-col items-center justify-center p-4 bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors">
                                <i class="fas fa-arrow-up text-3xl mb-2"></i>
                                <span class="font-bold">XE RA</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Vehicle Info Panel -->
                <div class="bg-gray-800 rounded-xl overflow-hidden">
                    <div class="p-4 border-b border-gray-700">
                        <h2 class="font-bold text-lg flex items-center gap-2">
                            <i class="fas fa-car text-blue-400"></i>
                            Thông tin xe
                        </h2>
                    </div>
                    <div id="vehicle-info" class="p-4">
                        <p class="text-gray-500 text-center py-8">
                            <i class="fas fa-search text-4xl mb-2 block"></i>
                            Nhập biển số để tra cứu
                        </p>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="bg-gray-800 rounded-xl overflow-hidden">
                    <div class="p-4 border-b border-gray-700">
                        <h2 class="font-bold text-lg flex items-center gap-2">
                            <i class="fas fa-bolt text-yellow-400"></i>
                            Thao tác nhanh
                        </h2>
                    </div>
                    <div class="p-4 grid grid-cols-2 gap-3">
                        <button onclick="openGate()" 
                            class="flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                            <i class="fas fa-door-open"></i>
                            <span>Mở Barrier</span>
                        </button>
                        <button onclick="closeGate()" 
                            class="flex items-center justify-center gap-2 p-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors">
                            <i class="fas fa-door-closed"></i>
                            <span>Đóng Barrier</span>
                        </button>
                        <button onclick="captureImage()" 
                            class="flex items-center justify-center gap-2 p-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
                            <i class="fas fa-camera"></i>
                            <span>Chụp ảnh</span>
                        </button>
                        <button onclick="lookupPlate()" 
                            class="flex items-center justify-center gap-2 p-3 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors">
                            <i class="fas fa-search"></i>
                            <span>Tra cứu</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Notification -->
    <div id="toast" class="fixed bottom-4 right-4 transform translate-y-full transition-transform duration-300">
        <div class="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-xl min-w-[300px]">
            <div class="flex items-center gap-3">
                <div id="toast-icon" class="p-2 rounded-lg">
                    <i class="fas fa-check"></i>
                </div>
                <div>
                    <p id="toast-title" class="font-bold"></p>
                    <p id="toast-message" class="text-sm text-gray-400"></p>
                </div>
            </div>
        </div>
    </div>

    <script>
        let autoDetect = true;
        let ws = null;
        const detectionLog = [];

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            updateTime();
            setInterval(updateTime, 1000);
            setInterval(refreshFrame, 100);
            connectWebSocket();
        });

        function updateTime() {
            const now = new Date();
            document.getElementById('current-time').textContent = now.toLocaleString('vi-VN');
        }

        function refreshFrame() {
            const img = document.getElementById('camera-feed');
            img.src = '/api/frame?' + new Date().getTime();
        }

        function connectWebSocket() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleDetection(data);
            };
            
            ws.onclose = () => {
                setTimeout(connectWebSocket, 3000);
            };
        }

        function handleDetection(data) {
            if (!autoDetect) return;
            
            if (data.type === 'detection' && data.plates && data.plates.length > 0) {
                const plate = data.plates[0].plate;
                showDetection(plate);
                addToLog(plate, data.timestamp);
                lookupVehicle(plate);
            }
        }

        function showDetection(plate) {
            const overlay = document.getElementById('detection-overlay');
            const plateText = document.getElementById('detected-plate');
            
            plateText.textContent = plate;
            overlay.classList.remove('hidden');
            overlay.classList.add('detection-flash');
            
            setTimeout(() => overlay.classList.remove('detection-flash'), 500);
            
            // Auto-hide after 5 seconds
            setTimeout(() => overlay.classList.add('hidden'), 5000);
        }

        function addToLog(plate, timestamp) {
            const log = document.getElementById('detection-log');
            const time = new Date(timestamp).toLocaleTimeString('vi-VN');
            
            const entry = document.createElement('div');
            entry.className = 'flex justify-between items-center p-2 bg-gray-700/50 rounded-lg';
            entry.innerHTML = `
                <div class="flex items-center gap-2">
                    <i class="fas fa-car text-blue-400"></i>
                    <span class="font-mono font-bold">${plate}</span>
                </div>
                <span class="text-gray-400 text-sm">${time}</span>
            `;
            
            if (log.querySelector('.text-gray-500')) {
                log.innerHTML = '';
            }
            log.insertBefore(entry, log.firstChild);
            
            // Keep only last 20 entries
            while (log.children.length > 20) {
                log.removeChild(log.lastChild);
            }
        }

        function clearLog() {
            document.getElementById('detection-log').innerHTML = 
                '<p class="text-gray-500 text-center py-4">Chưa có phát hiện nào</p>';
        }

        function toggleAutoDetect() {
            autoDetect = !autoDetect;
            const btn = document.getElementById('auto-detect-btn');
            if (autoDetect) {
                btn.className = 'px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors';
                btn.innerHTML = '<i class="fas fa-magic mr-2"></i>Auto Detect: ON';
            } else {
                btn.className = 'px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors';
                btn.innerHTML = '<i class="fas fa-ban mr-2"></i>Auto Detect: OFF';
            }
        }

        async function simulateSwipe(type) {
            const endpoint = type === 'entry' ? '/api/simulate-swipe/entry' : '/api/simulate-swipe/exit';
            const actionName = type === 'entry' ? 'Quẹt thẻ vào' : 'Quẹt thẻ ra';
            
            showToast('Đang xử lý', `Đang thực hiện ${actionName}...`, 'info');
            
            try {
                const response = await fetch(endpoint, { method: 'POST' });
                const data = await response.json();
                
                if (data.success) {
                    const plate = data.detected_plate;
                    const msg = data.message || 'Thành công';
                    
                    showToast('Thành công', `Xe ${plate}: ${msg}`, 'success');
                    addToLog(plate, new Date().toISOString());
                    
                    // Show detection on overlay
                    showDetection(plate);
                    
                    // Update vehicle info
                    lookupVehicle(plate);
                } else {
                    showToast('Thất bại', data.error || 'Không thể thực hiện', 'error');
                }
            } catch (e) {
                showToast('Lỗi', 'Lỗi kết nối server', 'error');
            }
        }

        async function manualEntry() {
            const plate = document.getElementById('manual-plate').value.trim().toUpperCase();
            if (!plate) {
                showToast('Lỗi', 'Vui lòng nhập biển số xe', 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/entry', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ license_plate: plate })
                });
                const data = await response.json();
                
                if (data.success) {
                    showToast('Thành công', `Đã ghi nhận xe ${plate} vào bãi`, 'success');
                    addToLog(plate, new Date().toISOString());
                    document.getElementById('manual-plate').value = '';
                } else {
                    showToast('Lỗi', data.error || 'Không thể ghi nhận xe vào', 'error');
                }
            } catch (e) {
                showToast('Lỗi', 'Không thể kết nối server', 'error');
            }
        }

        async function manualExit() {
            const plate = document.getElementById('manual-plate').value.trim().toUpperCase();
            if (!plate) {
                showToast('Lỗi', 'Vui lòng nhập biển số xe', 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/exit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ license_plate: plate })
                });
                const data = await response.json();
                
                if (data.success) {
                    const fee = data.data?.parkingFee;
                    const msg = fee ? `Phí: ${fee.toLocaleString('vi-VN')} VND` : '';
                    showToast('Thành công', `Đã ghi nhận xe ${plate} ra khỏi bãi. ${msg}`, 'success');
                    document.getElementById('manual-plate').value = '';
                } else {
                    showToast('Lỗi', data.error || 'Không thể ghi nhận xe ra', 'error');
                }
            } catch (e) {
                showToast('Lỗi', 'Không thể kết nối server', 'error');
            }
        }

        function handleManualInput(event) {
            if (event.key === 'Enter') {
                lookupPlate();
            }
        }

        async function lookupPlate() {
            const plate = document.getElementById('manual-plate').value.trim().toUpperCase();
            if (plate) {
                await lookupVehicle(plate);
            }
        }

        async function lookupVehicle(plate) {
            const infoDiv = document.getElementById('vehicle-info');
            infoDiv.innerHTML = '<p class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl"></i></p>';
            
            try {
                const response = await fetch(`/api/vehicle/${plate}`);
                const data = await response.json();
                
                if (data.success && data.data) {
                    const v = data.data;
                    const subscription = data.subscription;
                    
                    infoDiv.innerHTML = `
                        <div class="space-y-3">
                            <div class="text-center">
                                <p class="text-3xl font-bold font-mono text-blue-400">${v.licensePlate}</p>
                                <p class="text-sm text-gray-400">${getVehicleType(v.vehicleType)}</p>
                            </div>
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div class="bg-gray-700/50 p-2 rounded">
                                    <p class="text-gray-400">Chủ xe</p>
                                    <p class="font-medium">${v.ownerName || '-'}</p>
                                </div>
                                <div class="bg-gray-700/50 p-2 rounded">
                                    <p class="text-gray-400">Căn hộ</p>
                                    <p class="font-medium">${v.roomNumber || '-'}</p>
                                </div>
                            </div>
                            ${subscription ? `
                                <div class="bg-green-900/30 border border-green-700 p-3 rounded-lg">
                                    <div class="flex items-center gap-2 text-green-400">
                                        <i class="fas fa-check-circle"></i>
                                        <span class="font-medium">Có gói cước ${getSubType(subscription.subscriptionType)}</span>
                                    </div>
                                    <p class="text-sm text-gray-400 mt-1">Hết hạn: ${new Date(subscription.endDate).toLocaleDateString('vi-VN')}</p>
                                </div>
                            ` : `
                                <div class="bg-yellow-900/30 border border-yellow-700 p-3 rounded-lg">
                                    <div class="flex items-center gap-2 text-yellow-400">
                                        <i class="fas fa-exclamation-triangle"></i>
                                        <span class="font-medium">Không có gói cước</span>
                                    </div>
                                    <p class="text-sm text-gray-400 mt-1">Tính phí theo lượt</p>
                                </div>
                            `}
                        </div>
                    `;
                } else {
                    infoDiv.innerHTML = `
                        <div class="text-center py-8 text-yellow-400">
                            <i class="fas fa-exclamation-triangle text-4xl mb-2 block"></i>
                            <p class="font-medium">Xe chưa đăng ký</p>
                            <p class="text-sm text-gray-400 mt-1">Biển số: ${plate}</p>
                        </div>
                    `;
                }
            } catch (e) {
                infoDiv.innerHTML = `
                    <p class="text-center py-8 text-red-400">
                        <i class="fas fa-times-circle text-4xl mb-2 block"></i>
                        Lỗi kết nối
                    </p>
                `;
            }
        }

        function getVehicleType(type) {
            const types = {
                'CAR': 'Ô tô',
                'MOTORBIKE': 'Xe máy',
                'BICYCLE': 'Xe đạp',
                'ELECTRIC_BIKE': 'Xe đạp điện'
            };
            return types[type] || type;
        }

        function getSubType(type) {
            const types = {
                'MONTHLY': 'Tháng',
                'QUARTERLY': 'Quý',
                'YEARLY': 'Năm',
                'VISITOR': 'Khách'
            };
            return types[type] || type;
        }

        function openGate() {
            showToast('Barrier', 'Đã mở barrier', 'info');
            // TODO: Send command to physical barrier
        }

        function closeGate() {
            showToast('Barrier', 'Đã đóng barrier', 'info');
            // TODO: Send command to physical barrier
        }

        function captureImage() {
            window.open('/api/capture', '_blank');
            showToast('Chụp ảnh', 'Đã chụp ảnh màn hình', 'success');
        }

        function showToast(title, message, type = 'info') {
            const toast = document.getElementById('toast');
            const icon = document.getElementById('toast-icon');
            const titleEl = document.getElementById('toast-title');
            const msgEl = document.getElementById('toast-message');
            
            titleEl.textContent = title;
            msgEl.textContent = message;
            
            const colors = {
                success: 'bg-green-600',
                error: 'bg-red-600',
                info: 'bg-blue-600',
                warning: 'bg-yellow-600'
            };
            
            const icons = {
                success: 'fa-check',
                error: 'fa-times',
                info: 'fa-info',
                warning: 'fa-exclamation'
            };
            
            icon.className = `p-2 rounded-lg ${colors[type]}`;
            icon.innerHTML = `<i class="fas ${icons[type]}"></i>`;
            
            toast.classList.remove('translate-y-full');
            setTimeout(() => toast.classList.add('translate-y-full'), 4000);
        }
    </script>
</body>
</html>
"""


# ============ API Endpoints ============
@app.get("/", response_class=HTMLResponse)
async def get_index():
    """Serve the main gate control interface"""
    return HTMLResponse(content=HTML_TEMPLATE)


@app.get("/api/frame")
async def get_frame():
    """Get current camera frame as JPEG"""
    frame = camera_processor.get_current_frame()

    if frame is None:
        # Return a placeholder image
        placeholder = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.putText(
            placeholder,
            "No Camera",
            (200, 240),
            cv2.FONT_HERSHEY_SIMPLEX,
            2,
            (255, 255, 255),
            2,
        )
        frame = placeholder

    _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
    return HTMLResponse(content=buffer.tobytes(), media_type="image/jpeg")


@app.get("/api/capture")
async def capture_image():
    """Capture and return current frame"""
    frame = camera_processor.get_current_frame()

    if frame is None:
        raise HTTPException(status_code=500, detail="No camera frame available")

    # Add timestamp
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cv2.putText(frame, timestamp, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
    return HTMLResponse(
        content=buffer.tobytes(),
        media_type="image/jpeg",
        headers={
            "Content-Disposition": f"attachment; filename=capture_{timestamp.replace(':', '-')}.jpg"
        },
    )


@app.post("/api/entry")
async def api_entry(request: ManualEntryRequest):
    """Record vehicle entry (manual)"""
    result = await backend_client.record_entry(request.license_plate.upper())
    return JSONResponse(content=result)


@app.post("/api/exit")
async def api_exit(request: ManualExitRequest):
    """Record vehicle exit (manual)"""
    result = await backend_client.record_exit(request.license_plate.upper())
    return JSONResponse(content=result)


@app.get("/api/vehicle/{license_plate}")
async def get_vehicle(license_plate: str):
    """Get vehicle information"""
    vehicle_result = await backend_client.get_vehicle_info(license_plate.upper())

    if vehicle_result["success"] and vehicle_result.get("data"):
        # Also check subscription
        vehicle_id = vehicle_result["data"].get("id")
        if vehicle_id:
            sub_result = await backend_client.check_subscription(vehicle_id)
            vehicle_result["subscription"] = sub_result.get("data")

    return JSONResponse(content=vehicle_result)


@app.post("/api/simulate-swipe/entry")
async def simulate_swipe_entry():
    """Simulate card swipe for entry"""
    # 1. Detect with retry (try for 5 seconds)
    print("Starting detection sequence for entry simulation...")
    detection = None
    start_time = datetime.now()

    while (datetime.now() - start_time).total_seconds() < 5.0:
        current_detection = camera_processor.capture_and_detect()
        if current_detection and current_detection["plates"]:
            detection = current_detection
            break
        await asyncio.sleep(0.2)

    if not detection or not detection["plates"]:
        return JSONResponse(
            {
                "success": False,
                "error": "Không phát hiện thấy biển số xe sau 5 giây. Vui lòng thử lại.",
            }
        )

    plate_text = detection["plates"][0]["plate"]

    # 2. Check Vehicle
    check_result = await backend_client.check_vehicle(plate_text)

    if not check_result["success"]:
        return JSONResponse(check_result)

    vehicle_info = check_result["data"]
    is_registered = vehicle_info.get("isRegistered", False)

    # 3. Record Entry
    vehicle_type = vehicle_info.get("vehicleType", "CAR")

    # For simulation, use registered card or generate visitor card
    card_number = vehicle_info.get("cardNumber")
    if not card_number:
        card_number = f"VISITOR-{int(datetime.now().timestamp())}"

    entry_result = await backend_client.record_entry(
        license_plate=plate_text,
        vehicle_type=vehicle_type,
        card_number=card_number,
        notes="Simulated Card Swipe",
    )

    return JSONResponse(
        {
            "success": True,
            "data": entry_result.get("data"),
            "detected_plate": plate_text,
            "is_registered": is_registered,
            "message": (
                "Mời xe vào"
                if entry_result.get("success")
                else entry_result.get("error")
            ),
        }
    )


@app.post("/api/simulate-swipe/exit")
async def simulate_swipe_exit():
    """Simulate card swipe for exit"""
    # 1. Detect with retry (try for 5 seconds)
    print("Starting detection sequence for exit simulation...")
    detection = None
    start_time = datetime.now()

    while (datetime.now() - start_time).total_seconds() < 5.0:
        current_detection = camera_processor.capture_and_detect()
        if current_detection and current_detection["plates"]:
            detection = current_detection
            break
        await asyncio.sleep(0.2)

    if not detection or not detection["plates"]:
        return JSONResponse(
            {
                "success": False,
                "error": "Không phát hiện thấy biển số xe sau 5 giây. Vui lòng thử lại.",
            }
        )

    plate_text = detection["plates"][0]["plate"]

    # 2. Record Exit
    exit_result = await backend_client.record_exit(license_plate=plate_text)

    return JSONResponse(
        {
            "success": True,
            "data": exit_result.get("data"),
            "detected_plate": plate_text,
            "message": (
                "Mời xe ra" if exit_result.get("success") else exit_result.get("error")
            ),
        }
    )


@app.get("/api/status")
async def get_status():
    """Get system status"""
    return JSONResponse(
        content={
            "camera": camera_processor.running,
            "detector": detector_model is not None,
            "ocr": ocr_model is not None,
            "backend": BACKEND_API_URL,
        }
    )


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time detection updates"""
    await manager.connect(websocket)
    try:
        while True:
            # Check for new detections
            try:
                detection = detection_queue.get_nowait()
                await websocket.send_json(
                    {
                        "type": "detection",
                        "timestamp": detection["timestamp"],
                        "plates": detection["plates"],
                    }
                )
            except queue.Empty:
                pass

            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ============ Main ============
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
