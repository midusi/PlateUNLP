from flask import request, jsonify, current_app as app
import os
import base64
import cv2
from app.helpers.DictPersistJSON import DictPersistJSON

def load():

    dir_path = request.values["dir_path"]
    img_name = request.values["img_name"]
    
    filename = os.path.join(dir_path, img_name)
    img_info = cv2.imread(filename, -1)
    img = cv2.imread(filename)

    original_dtype = img_info.dtype
    original_height, original_width, _ = img.shape

    if not (img_name.split(sep='.')[-1] == 'png'):
        if((original_width < original_height)):
            img = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
        original_height, original_width, _ = img.shape 
        filename = os.path.join(dir_path, app.config['PNG_FOLDER'], img_name+'.jpg')
        if not os.path.exists(os.path.join(dir_path, app.config['PNG_FOLDER'])):
            os.mkdir(os.path.join(dir_path, app.config['PNG_FOLDER']))
        cv2.imwrite(filename, img, [cv2.IMWRITE_JPEG_QUALITY, 50])    
    
    with open(filename, "rb") as f:
        image_binary = f.read()
    
    image = base64.b64encode(image_binary).decode("utf-8")
    
    # Make data for return mesagge
    data = {
        'status': True,
        'image': image,
        'info': {
            'width': original_width,
            'heigth': original_height,
            "name": img_name.split(sep=".")[0],
            "ext": img_name.split(sep=".")[-1],
            "path":os.path.join(dir_path, img_name),
            "dtype": str(original_dtype)
        }
    }
    
    # It checks if there is information saved for that image and 
    # if it exists it adds its information to data
    cache_path = os.path.join(app.static_folder, 'cache', img_name+".json")
    if (os.path.isfile(cache_path)):
        print("Entre al if")
        dataList = DictPersistJSON(cache_path)["body"]
        print(dataList)
        bbox = dataList["bbox_arr"]
        metadata = dataList["data_arr"]
        data["info"]["bboxes"] = bbox
        data["info"]["metadata"] = metadata
        
    # API response messaje
    print("--Data--")
    print(data)
    resp = jsonify(data)
    resp.status_code = 200
    
    return resp

# Receives the information of an image and saves it in a local file
def save():
    # params
    body = request.get_json()
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

# Receives the information of an image and saves it in a local file
def delete():
    # params
    img_name = request.values["img_name"]
    
    # Valid the information received
    # Por ahora no realiza ninguna verificacion
    
    # Delete the information of an image if it exists
    delete_path = os.path.join(app.static_folder, 'cache', img_name+".json")
    if (os.path.isfile(delete_path)):
        os.remove(delete_path)
        
    # API response messaje
    message = {
        'img_name_deleted': img_name
    }
    resp = jsonify(message)
    resp.status_code = 200
    return resp