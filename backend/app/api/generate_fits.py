from flask import request, json, Response, abort, current_app as app
from astropy.io import fits
import os
import cv2
import shutil
from app.helpers.DictPersistJSON import DictPersistJSON
from app.helpers.generate_txt import generate_txt
from app.api.config import get_workspace_path

def api_generate_fits():

    img_name = request.json["img_name"]
    path_dir = request.json["path_dir"]
    bbox_arr = request.json["bbox_arr"]
    data_arr = request.json["data_arr"]
    plate_data = request.json["plate_data"]
    fields = request.json["fields"]
    
    # Verificar que no solo se esten recibiendo caracteres en formato ASCII
    bad_format_list = {}
    for key, value in plate_data.items():
        if not value.isascii():
            bad_format_list.add(key)
    for metadata_dict in data_arr:
        for key, value in metadata_dict.items():
            if isinstance(value, str) and not value.isascii():
                bad_format_list.add(key)
    if bad_format_list:
        print("Los campos enviados tienen caracteres no ASCII. FITS no los soporta")
        data = {
            "status": False,
            "status_code": 400,
            "message": "Error: Los campos "+str(bad_format_list)+" solo pueden tener caracteres tipo ASCII"
        }
        return json.jsonify(**data)

        
    # Verificar que no se repita el nombre de OBJECT en 2 espectros distintos
    objects = []
    for metadata_dict in data_arr:
        for object in objects:
            if(object == metadata_dict["OBJECT"]+"_"+metadata_dict["SUFFIX"]):
                print("Se recibio una combinacion de OBJECT_SUFFIX repetida, esto no esta permitido")
                data = {
                    "status": False,
                    "status_code": 400,
                    "message": "Error: Cada combinacion OBJECT_SUFFIX solo puede aparecer una vez, revisar cuantos elementos tienen OBJECT="+metadata_dict["OBJECT"]+" y SUFFIX="+metadata_dict["SUFFIX"]}
                return json.jsonify(**data)
        objects.append(metadata_dict["OBJECT"]+"_"+metadata_dict["SUFFIX"])

    # Obtencion de variables utiles
    image_path = os.path.join(path_dir, img_name)
    img_name_arr = img_name.split(".")
    img_ext = img_name_arr[len(img_name_arr) - 1]
    img_name = img_name[0:img_name.rfind(".")]
    # generate dir output
    output_path = os.path.join(path_dir, "output")
    if not (os.path.exists(output_path)):
        os.mkdir(output_path)
        
    # Borrado de archivos viejos de la placa en caso de que los haya
    files = os.listdir(output_path)
    print("---------------------------------")
    for file in files:
        print(file)
        if (file.startswith(img_name+"_")):
            os.remove(os.path.join(output_path, file))
    
    # cropped
    for bbox,data in zip(bbox_arr,data_arr):
        data.pop('id', None)
        data.pop('color', None)
        data.pop('loaded', None)
        

        # The flag to -1 loads the image as is
        rotated = False;
        img = cv2.imread(image_path, -1)
        original_height, original_width = img.shape
        if((original_width < original_height)):
            img = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
            original_height, original_width = img.shape
            rotated = True;
        
        #if (original_width > original_height):
            
        x = int(bbox["x"])
        y = int(bbox["y"])
        w = int(bbox["w"])
        h = int(bbox["h"])
        
        if(y < 0 or y>original_height):
            y = 0
        if(y+h > original_height):
            h = original_height - y 
        if(x<0 or x > original_width):
            x = 0
        if(x+w > original_width):
            w = original_width - x 

        # crop image
        crop_img = img[y:y+h, x:x+w]
        crop_img = crop_img[:,:]
        file_output_name = f'{img_name}_{data["OBJECT"]}_{data["SUFFIX"]}'
        # saved image crop
        cv2.imwrite(os.path.join(output_path, f'{file_output_name}.png'),crop_img)

        # generated fit
        prihdr = fits.Header()
        for key in fields.keys():
            comment = ''
            if 'info' in fields[key].keys():
                comment = fields[key]["info"]
            if fields[key]["global"]:
                prihdr[key] = (plate_data[key], comment)
            else:
                prihdr[key] = (data[key], comment)
            
        prihdr["GAIN"] = ("","Gain, electrons per adu")
        prihdr["NOISE"] = ("","Read noise")

        if prihdr["EQUINOX"] != '':  
          prihdr["EQUINOX"] = float(prihdr["EQUINOX"])
        else:
          prihdr["EQUINOX"] = None
          
        fits.writeto(
            (os.path.join(output_path, f'{file_output_name}.fits')), 
            crop_img, 
            prihdr, 
            overwrite=True)
        generate_txt(plate_data,data,output_path,file_output_name)
    working_path = os.path.join(get_workspace_path(), 'cache', 'working', img_name+"."+img_ext+".json")
    saved_path = os.path.join(get_workspace_path(), 'cache' ,'saved', img_name+"."+img_ext+".json")
    shutil.move(working_path, saved_path)
    # api response data
    data = {
        "status": True
    }

    return json.jsonify(**data)
