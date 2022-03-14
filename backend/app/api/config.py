from flask import request, json, current_app as app
import os
from app.helpers.DictPersistJSON import DictPersistJSON

def api_save_config():
    config = request.json["config"]

    full_path = os.path.join(app.static_folder, '.config')
    if not os.path.exists(full_path):
            os.mkdir(full_path)
    save_path = os.path.join(full_path, "db.json")
    print(save_path)
    db = DictPersistJSON(save_path)
    db["config"] = config

    # api response data
    data = {
        "message": 'success'
    }

    return json.jsonify(**data)

def api_load_config():

    full_path = os.path.join(app.static_folder, '.config', "db.json")
    config = {}
    if os.path.isfile(full_path):
        config = DictPersistJSON(full_path)["config"]
    
    # api response data
    data = {
        "config": config
    }

    return json.jsonify(**data)