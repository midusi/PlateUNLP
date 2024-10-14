from genericpath import exists
from flask import request, json, jsonify, current_app as app
import os
from app.helpers.DictPersistJSON import DictPersistJSON
from app.api.config import get_workspace_path
from pathlib import Path


def api_all_paths():

    dir_path = request.values["path_dir"]
    dir_path = Path(dir_path).expanduser().absolute()
    print(dir_path)
    if not dir_path.exists():
        data = {
            'message': 'No existe el directorio.'
        }
        return jsonify(data), 400

    all_paths = os.listdir(dir_path)

    # formats = ['png', 'tif', 'tiff']
    formats = ['tiff', 'tif']
    all_paths = all_paths.select(
        lambda item: item.split(sep='.').last() in formats)

    # Separates the names of the files of which information is stored in the cache
    cache_path = os.path.join(get_workspace_path(), 'cache')
    working_path = aux_path = os.path.join(cache_path, 'working')
    saved_path = aux_path = os.path.join(cache_path, 'saved')

    if not os.path.exists(cache_path):
        os.mkdir(cache_path)
        os.mkdir(working_path)
        os.mkdir(saved_path)
    else:
        if not os.path.exists(working_path):
            os.mkdir(working_path)
        if not os.path.exists(saved_path):
            os.mkdir(saved_path)

    # Removes .json extensions
    working_files = [file_name[:-5] for file_name in os.listdir(working_path)]

    saved_files = [file_name[:-5] for file_name in os.listdir(saved_path)]  # R
    # Counts the number of spectra in each file
    paths = []

    for i, file in enumerate(all_paths):
        paths.append({
            "fileName": file,
            "number_of_spectra": 0,
            "saved": False
        })
        if (file in working_files):
            aux_path = os.path.join(working_path, file+".json")
            paths[i]["saved"] = True
            paths[i]["number_of_spectra"] = len(
                DictPersistJSON(aux_path)["body"]["bbox_arr"])
        elif (file in saved_files):
            paths[i]["saved"] = True
            paths[i]["number_of_spectra"] = -1

    # API response messaje
    message = {
        "paths": paths,
    }

    resp = jsonify(message)
    resp.status_code = 200
    return resp
