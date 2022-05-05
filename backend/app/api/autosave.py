from flask import jsonify, request, current_app as app
import os
from app.helpers.DictPersistJSON import DictPersistJSON

# Receives the information of an image and saves it in a local file
def save():
    # params
    body = request.get_json()
  
    #body = request.json["body"]
    img_name = body["img_name"]

    
    # Valid the information received
    # Por ahora no realiza ninguna verificacion
    
    # Save image data in .json files
    full_path = os.path.join(app.static_folder, 'cache')
    if not os.path.exists(full_path):
        os.mkdir(full_path)
    save_path = os.path.join(full_path, img_name+".json")
 
    db = DictPersistJSON(save_path)
    db["body"] = body
    
    # API response messaje
    message = {
        'message': "success"
    }
    resp = jsonify(message)
    resp.status_code = 201
    return resp
