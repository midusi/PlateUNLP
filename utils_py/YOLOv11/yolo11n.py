import torch
from ultralytics import YOLO

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load a model
model = YOLO("yolo11n.pt")  # load a pretrained model (recommended for training)

model.to(device)

# Train the model
results = model.train(data="coco8.yaml", epochs=100, imgsz=640)