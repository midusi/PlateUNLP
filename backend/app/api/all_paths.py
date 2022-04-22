from flask import request, json, jsonify, current_app as app
import os
from app.helpers.DictPersistJSON import DictPersistJSON


def api_all_paths():

    dir_path = request.values["path_dir"]

    if not os.path.exists(dir_path):
        data = {
            'message': 'No existe el directorio.'
        }
        return jsonify(data), 400

    all_paths = os.listdir(dir_path)

    #formats = ['png', 'tif', 'tiff']
    formats = ['tiff']
    all_paths = all_paths.select(lambda item: item.split(sep='.').last() in formats)
    
    # api response data
    data = {
        "paths": all_paths
    }

    return json.jsonify(**data)