from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
from ultralytics import YOLO
import numpy as np
import cv2
import io
import base64

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


model = YOLO("yolov8n.pt")


class DetectionResult(BaseModel):
    message: str
    image: str


def detect_objects(image: Image.Image):
    img = np.array(image)

    results = model(img)

    class_names = model.names

    result = results[0]

    boxes = result.boxes.xyxy

    confidences = result.boxes.conf

    class_ids = result.boxes.cls

    for box, confidence, class_id in zip(boxes, confidences, class_ids):
        x1, y1, x2, y2 = map(int, box)

        label = class_names[int(class_id)]

        text = f"{label} {confidence:.2f}"
        cv2.rectangle(img, (x1, y1), (x2, y2), (255, 0, 0), 2)
        cv2.putText(
            img, text, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 0, 0), 2
        )
    result_image = Image.fromarray(img)
    return result_image


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.post("/detect", response_model=DetectionResult)
async def detect_service(message: str = Form(...), file: UploadFile = File(...)):
    image = Image.open(io.BytesIO(await file.read()))

    if image.mode != "RGB":
        image = image.convert("RGB")

    result_image = detect_objects(image)

    buffered = io.BytesIO()

    result_image.save(buffered, format="JPEG")

    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")

    return DetectionResult(message=message, image=img_str)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", port=8000, reload=True)
