from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import uvicorn
import os
import cv2
import numpy as np
import io
import base64

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model
model = YOLO("yolo11n.pt")  # Load a pretrained model (nano version for speed)

@app.get("/health")
def health_check():
    return {"status": "ok", "model": "yolo11n"}

def get_threat_color(class_name, confidence):
    if class_name == 'person':
        if confidence > 0.8:
            return (0, 0, 255)  # Red (BGR)
        elif confidence > 0.65:
            return (0, 165, 255) # Orange (BGR)
    if class_name in ['car', 'truck', 'motorcycle', 'bicycle']:
        return (0, 255, 255) # Yellow (BGR)
    return (0, 255, 0) # Green (BGR)

@app.post("/detect")
async def detect(
    file: UploadFile = File(...),
    camera_name: str = Form(None),
    show_confidence: bool = Form(True),
    show_label: bool = Form(True)
):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Inference
    results = model(img)
    
    detections = []
    
    # Create a copy for annotation
    annotated_img = img.copy()
    
    for result in results:
        boxes = result.boxes
        for box in boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()
            class_name = model.names[cls]
            
            detections.append({
                "class": class_name,
                "confidence": conf,
                "bbox": xyxy
            })
            
            # Draw on image
            x1, y1, x2, y2 = map(int, xyxy)
            color = get_threat_color(class_name, conf)
            
            # Draw rectangle
            cv2.rectangle(annotated_img, (x1, y1), (x2, y2), color, 2)
            
            # Draw label
            if show_label:
                label = f"{class_name}"
                if show_confidence:
                    label += f" {conf:.0%}"
                
                (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)
                cv2.rectangle(annotated_img, (x1, y1 - 20), (x1 + w, y1), color, -1)
                cv2.putText(annotated_img, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

    # Add camera name overlay
    if camera_name:
        # Create a semi-transparent background for the text
        overlay = annotated_img.copy()
        text_size, _ = cv2.getTextSize(camera_name, cv2.FONT_HERSHEY_SIMPLEX, 1.0, 2)
        text_w, text_h = text_size
        
        # Position: Top left
        cv2.rectangle(overlay, (10, 10), (10 + text_w + 20, 10 + text_h + 20), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.6, annotated_img, 0.4, 0, annotated_img)
        
        # Draw text
        cv2.putText(annotated_img, camera_name, (20, 10 + text_h + 10), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)

    _, buffer = cv2.imencode('.jpg', annotated_img)
    annotated_image_base64 = base64.b64encode(buffer).decode('utf-8')

    return {
        "detections": detections,
        "count": len(detections),
        "annotated_image": annotated_image_base64
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
