from flask import current_app as app
import os
import torch


# La clase implementa el patron singleton.
# De forma externa se usa como cualquier otra clase.
# Ejemplo de uso:
### from app.static.detector.UI import Detector # Importar
### detector = Detector() # Recuperar instancia
### detections = detector.infer(output, width) # inferir
# referencia para entender el patron: https://www.geeksforgeeks.org/singleton-pattern-in-python-a-complete-guide/

class Detector:
    
    def __new__(cls):
        if not hasattr(cls, 'instance'):
            cls.instance = super(Detector, cls).__new__(cls)
            cls.instance.__loadModel()
        return cls.instance
    
    def  __loadModel(self):
        """Recarga la variable 'model' guardado en la instancia de la clase actual segun su archivo de carga"""
        # recover paths
        model_path = os.path.join(app.static_folder, 'detector', 'models', "best.pt")
        yolov5_path = os.path.join(app.static_folder, 'detector', 'yolov5')
        # load yolo model
        self.model = torch.hub.load(yolov5_path, 'custom', path=model_path, source='local')
        
    def infer(self, output, width):
        """Realiza una inferencia en base al la imagen recibida."""
        return self.model(output, size=width)