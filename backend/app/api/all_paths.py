from genericpath import exists
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

    # formats = ['png', 'tif', 'tiff']
    formats = ['tiff']
    all_paths = all_paths.select(lambda item: item.split(sep='.').last() in formats)
    
    # Separates the names of the files of which information is stored in the cache
    cache_path = aux_path = os.path.join(app.static_folder, 'cache')
    cache_files = [file_name[0:len(file_name)-5] for file_name in os.listdir(cache_path)]
    have_data = []
    for file in all_paths:
        if (file in cache_files):
            have_data.append(file)
            
    # Counts the number of spectra in each file
    paths = []
   
    for i,file in enumerate(all_paths):
        paths.append({
            "fileName": file,
            "number_of_spectra": 0
        })
        if(file in have_data):
            aux_path = os.path.join(cache_path, file+".json")
            paths[i]["number_of_spectra"] = len(DictPersistJSON(aux_path)["body"]["bbox_arr"])
        

        
    # API response messaje
    message = {
        "paths":paths,
    }

    resp = jsonify(message)
    resp.status_code = 200
    return resp