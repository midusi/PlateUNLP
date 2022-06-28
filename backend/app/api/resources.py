from flask import request, jsonify, Blueprint, current_app as app
import cv2
import os
from app.helpers.DictPersistJSON import DictPersistJSON

resources_api = Blueprint("resources", __name__, url_prefix="/api/resources")

@resources_api.get("/")
def get_resource():
    resource_name = request.json["resource_name"]

    full_path = os.path.join(app.static_folder, 'resources')
    filename = os.path.join(full_path, resource_name)
    
    if (os.path.isfile(full_path)):
        resource = cv2.imread(filename)
        
        # api response data
        data = {
            "resource": resource
        }
        # API response messaje
        resp = jsonify(data)
        resp.status_code = 200
    
    else:
        # api response data
        data = {
            "404": "No existe el recurso solicitado"
        }
        # API response messaje
        resp = jsonify(data)
        resp.status_code = 404
        
    return resp