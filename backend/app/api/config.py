from numpy import full
from flask import request, json, current_app as app
import os
from app.helpers.DictPersistJSON import DictPersistJSON
from pathlib import Path

CONFIG_FOLDERNAME = "config"
CONFIG_FILENAME = "db.json.example"

def get_config_folder():
    path = Path(app.static_folder)/ CONFIG_FOLDERNAME 
    path = path.expanduser().absolute()
    path.mkdir(exist_ok=True,parents=True)
    return path

def get_config_path():
    return get_config_folder() / CONFIG_FILENAME

def api_save_config():
    config = request.json["config"]
    save_path = get_config_path()
    print(f"Saving config to {save_path}")
    db = DictPersistJSON(save_path)
    db["config"] = config

    # api response data
    data = {
        "message": 'success'
    }
    return json.jsonify(**data)

def api_load_config():

    path =  get_config_path()
    print(f"Using config path: {path}")
    config = {}
    if path.is_file():
        config = DictPersistJSON(path)["config"]
    else:
        raise Exception(f"File {path} does not exist")
    
    # api response data
    data = {
        "config": config
    }

    return json.jsonify(**data)