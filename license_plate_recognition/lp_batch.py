from PIL import Image
import cv2
import torch
import math
import function.utils_rotate as utils_rotate
import os
import time
import argparse
import function.helper as helper
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument("-i", "--input", required=True, help="path to input folder")
ap.add_argument("-o", "--output", required=True, help="path to output folder")
args = ap.parse_args()

# Create output directory if it doesn't exist
os.makedirs(args.output, exist_ok=True)

# Load models once
print("Loading models...")
yolo_LP_detect = torch.hub.load(
    "yolov5", "custom", path="model/LP_detector.pt", force_reload=True, source="local"
)
yolo_license_plate = torch.hub.load(
    "yolov5", "custom", path="model/LP_ocr.pt", force_reload=True, source="local"
)
yolo_license_plate.conf = 0.60
print("Models loaded!")

# Get all image files from input folder
image_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}
input_path = Path(args.input)
image_files = [f for f in input_path.iterdir() if f.suffix.lower() in image_extensions]

print(f"Found {len(image_files)} images to process")

for idx, image_file in enumerate(image_files):
    print(f"Processing [{idx+1}/{len(image_files)}]: {image_file.name}")

    img = cv2.imread(str(image_file))
    if img is None:
        print(f"  Warning: Could not read {image_file.name}, skipping...")
        continue

    plates = yolo_LP_detect(img, size=640)
    list_plates = plates.pandas().xyxy[0].values.tolist()
    list_read_plates = set()

    if len(list_plates) == 0:
        lp = helper.read_plate(yolo_license_plate, img)
        if lp != "unknown":
            cv2.putText(
                img, lp, (7, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (36, 255, 12), 2
            )
            list_read_plates.add(lp)
    else:
        for plate in list_plates:
            flag = 0
            x = int(plate[0])  # xmin
            y = int(plate[1])  # ymin
            w = int(plate[2] - plate[0])  # xmax - xmin
            h = int(plate[3] - plate[1])  # ymax - ymin
            crop_img = img[y : y + h, x : x + w]
            cv2.rectangle(
                img,
                (int(plate[0]), int(plate[1])),
                (int(plate[2]), int(plate[3])),
                color=(0, 0, 225),
                thickness=2,
            )

            lp = ""
            for cc in range(0, 2):
                for ct in range(0, 2):
                    lp = helper.read_plate(
                        yolo_license_plate, utils_rotate.deskew(crop_img, cc, ct)
                    )
                    if lp != "unknown":
                        list_read_plates.add(lp)
                        cv2.putText(
                            img,
                            lp,
                            (int(plate[0]), int(plate[1] - 10)),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.9,
                            (36, 255, 12),
                            2,
                        )
                        flag = 1
                        break
                if flag == 1:
                    break

    # Save output image
    output_file = Path(args.output) / image_file.name
    cv2.imwrite(str(output_file), img)

    if list_read_plates:
        print(f"  Detected plates: {', '.join(list_read_plates)}")
    else:
        print(f"  No plates detected")

print(f"\nDone! Processed {len(image_files)} images. Results saved to: {args.output}")
