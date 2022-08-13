from flask import request, jsonify, current_app as app
import os
import base64
import cv2
from app.helpers.DictPersistJSON import DictPersistJSON
from app.api.config import get_workspace_path
import shutil


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
        # cv2.imwrite(filename, img, [cv2.IMWRITE_JPEG_QUALITY, 50])
        cv2.imwrite(filename, img)   # <- Hay una reduccion implicita del 95% en la calidad de la imagen
    
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
    saved_path = os.path.join(get_workspace_path(), 'cache' ,'saved')
    working_path = os.path.join(get_workspace_path(), 'cache', 'working')
    if not os.path.exists(saved_path):
        os.mkdir(saved_path)
    if not os.path.exists(working_path):
        os.mkdir(working_path)
    saved_path = os.path.join(saved_path, img_name+".json")
    working_path =  os.path.join(working_path,img_name+".json")
    
    if (os.path.isfile(working_path) or os.path.isfile(saved_path)):
        if (os.path.isfile(working_path)):
            dataList = DictPersistJSON(working_path)["body"]
        else:
            dataList = DictPersistJSON(saved_path)["body"]
      
        
        print(dataList)
        bbox = dataList["bbox_arr"]
        plateData = dataList["plate_data"]
        metadata = dataList["data_arr"]
        data["info"]["bboxes"] = bbox
        data["info"]["metadata"] = metadata
        data["info"]["plateData"] = plateData

        
    # API response messaje
    resp = jsonify(data)
    resp.status_code = 200
    
    return resp

# Receives the information of an image and saves it in a local file
def save():
    # params
    body = request.get_json()
    img_name = body["img_name"]
    moved = False
    # Valid the information received
    # Por ahora no realiza ninguna verificacion
    # Save image data in .json files
    saved_path = os.path.join(get_workspace_path(), 'cache' ,'saved')
    if not os.path.exists(saved_path):
        os.mkdir(saved_path)

    full_path = os.path.join(get_workspace_path(), 'cache','working')
    if not os.path.exists(full_path):
        os.mkdir(full_path)

    save_path = os.path.join(full_path, img_name+".json")
    saved_path = os.path.join(saved_path,img_name+".json")
    if(os.path.isfile(saved_path)):
        os.remove(saved_path) 
        moved = True
    db = DictPersistJSON(save_path)
    db["body"] = body
    
    # API response messaje
    resp = jsonify(body)
    if(moved):
        resp.status_code = 201
    else:
        resp.status_code = 200
    return resp

# Receives the information of an image and saves it in a local file
def delete():
    # params
    body = request.get_json()
    img_name = body["img_name"]
    # Valid the information received
    # Por ahora no realiza ninguna verificacion
    delete_path = os.path.join(get_workspace_path(), 'cache','working')
    if not os.path.exists(delete_path):
        os.mkdir(delete_path)
    # Delete the information of an image if it exists
    delete_path = os.path.join(delete_path, img_name+".json")
    if (os.path.isfile(delete_path)):
        os.remove(delete_path)
        
    # API response messaje
    message = {
        'img_name_deleted': img_name
    }
    resp = jsonify(message)
    resp.status_code = 200
    return resp