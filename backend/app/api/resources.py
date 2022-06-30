from flask import request, jsonify, Blueprint, current_app as app
import base64
import os
from app.helpers.DictPersistJSON import DictPersistJSON

resources_api = Blueprint("resources", __name__, url_prefix="/api/resources")

@resources_api.get("/")
def get_resource():
    print("OK_1")
    resource_name = request.values["resource_name"]
    print("Se recibio ", resource_name," como parametro")

    full_path = os.path.join(app.static_folder, 'resources')
    filename = os.path.join(full_path, resource_name)
    print("Se buscara el archivo en la ruta ", filename)
    
    if (os.path.isfile(filename)):
        with open(filename, "rb") as f:
            resource_binary = f.read()
        
        resource = base64.b64encode(resource_binary).decode("utf-8")
        
        # api response data
        data = {
            "resource": resource
        }
        # API response message
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