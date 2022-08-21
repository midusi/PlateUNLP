from flask import current_app as app
import os
import torch

class Detector:
    
    def __init__(self):
        # create yolo model
        model_path = os.path.join(app.static_folder, 'detector', 'models', "best.pt")
        yolov5_path = os.path.join(app.static_folder, 'detector', 'yolov5')
        self.model = torch.hub.load(yolov5_path, 'custom',
                           path=model_path, source='local')
    
    def saludar(self):
        """Imprime un saludo en pantalla."""
        print("¡Hola, mundo!")
        
    def infer(self, output, width):
        """Realiza una inferencia en base al la imagen recibida."""
        return self.model(output, size=width)