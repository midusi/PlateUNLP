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
    invert_image = request.json.get("invert_image", False)

    # Verificar que se esta recibiendo el campo MAIN-ID en todos los espectros
    for metadata_dict in data_arr:
        if (metadata_dict.get("MAIN-ID", None) == None or metadata_dict.get("MAIN-ID", "") == ""):
            print(
                "No se recibio correctamente el valor Main-ID en alguno de los espectros")
            data = {
                "status": False,
                "status_code": 400,
                "message": "Falta datos en la solicitud, revisar que Main-ID este correctamente completado en todos los espectros"
            }
            return json.jsonify(**data)

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

    # Verificar que no se incluyen en MAIN-ID y/o SUFFIX ciertos caracteres problematicos para el nombramiento de archivos0: '\ / : * ? " < > |'
    bad_caracteres = ['\\', '/', ':', '*', '?', '"', '<', '>', '|']
    for metadata_dict in data_arr:
        for caracter in bad_caracteres:
            if ((caracter in metadata_dict["MAIN-ID"]) or (caracter in metadata_dict["SUFFIX"])):
                print(
                    "No se permite en MAIN-ID y/o SUFFIX el uso de los caracteres: "+str(bad_caracteres))
                data = {
                    "status": False,
                    "status_code": 400,
                    "message": "No se permite en MAIN-ID y/o SUFFIX el uso de los caracteres: "+str(bad_caracteres)
                }
                return json.jsonify(**data)

    # Verificar que no se repita el nombre de MAIN-ID_SUFFIX en 2 espectros distintos
    objects = []
    for metadata_dict in data_arr:
        for object in objects:
            if (object == metadata_dict["MAIN-ID"]+"_"+metadata_dict["SUFFIX"]):
                print(
                    "Se recibio una combinacion de MAIN-ID_SUFFIX repetida, esto no esta permitido")
                data = {
                    "status": False,
                    "status_code": 400,
                    "message": "Error: Cada combinacion MAIN-ID_SUFFIX solo puede aparecer una vez, revisar cuantos elementos tienen MAIN-ID="+metadata_dict["MAIN-ID"]+" y SUFFIX="+metadata_dict["SUFFIX"]}
                return json.jsonify(**data)
        objects.append(metadata_dict["MAIN-ID"]+"_"+metadata_dict["SUFFIX"])

    # Obtencion de variables utiles
    image_path = os.path.join(path_dir, img_name)
    img_name_arr = img_name.split(".")
    img_ext = img_name_arr[len(img_name_arr) - 1]
    img_name = img_name[0:img_name.rfind(".")]
    # generate dir output
    output_path = os.path.join(path_dir, "output")
    if not (os.path.exists(output_path)):
        os.mkdir(output_path)

    # Create a directory for this specific image's outputs
    image_output_dir = os.path.join(output_path, img_name)
    if not os.path.exists(image_output_dir):
        os.mkdir(image_output_dir)

    # Copy the original image file to the output directory
    shutil.copy2(image_path, os.path.join(image_output_dir, img_name + "." + img_ext))

    # Borrado de archivos viejos de la placa en caso de que los haya
    if os.path.exists(image_output_dir):
        files = os.listdir(image_output_dir)
        for file in files:
            if file != img_name + "." + img_ext and file.startswith(img_name+"_"):
                os.remove(os.path.join(image_output_dir, file))

    # cropped
    for bbox, data in zip(bbox_arr, data_arr):
        data.pop('id', None)
        data.pop('color', None)
        data.pop('loaded', None)

        # The flag to -1 loads the image as is
        rotated = False
        img = cv2.imread(image_path, -1)

        if len(img.shape) == 3:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        original_height, original_width = img.shape
        if ((original_width < original_height)):
            img = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
            original_height, original_width = img.shape
            rotated = True

        # if (original_width > original_height):

        x = int(bbox["x"])
        y = int(bbox["y"])
        w = int(bbox["w"])
        h = int(bbox["h"])

        if (y < 0 or y > original_height):
            y = 0
        if (y+h > original_height):
            h = original_height - y
        if (x < 0 or x > original_width):
            x = 0
        if (x+w > original_width):
            w = original_width - x

        # crop image
        crop_img = img[y:y+h, x:x+w]
        crop_img = crop_img[:, :]

        if invert_image:
            crop_img = 255 - crop_img

        pre_file_output_name = f'{img_name}_{data["MAIN-ID"]}' + (f'_{data["SUFFIX"]}' if data["SUFFIX"] else '')
        file_output_name = pre_file_output_name.replace(" ", "")
        # saved image crop
        cv2.imwrite(os.path.join(
            image_output_dir, f'{file_output_name}.png'), crop_img)

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

        prihdr["GAIN"] = ("", "Gain, electrons per adu")
        prihdr["NOISE"] = ("", "Read noise")

        if prihdr["EQUINOX"] != '':
            prihdr["EQUINOX"] = float(prihdr["EQUINOX"])
        else:
            prihdr["EQUINOX"] = None

        fits.writeto(
            (os.path.join(image_output_dir, f'{file_output_name}.fits')),
            crop_img,
            prihdr,
            overwrite=True)
        generate_txt(plate_data, data, image_output_dir, file_output_name)
    working_path = os.path.join(get_workspace_path(
    ), 'cache', 'working', img_name+"."+img_ext+".json")
    saved_path = os.path.join(get_workspace_path(
    ), 'cache', 'saved', img_name+"."+img_ext+".json")
    shutil.move(working_path, saved_path)
    # api response data
    data = {
        "status": True
    }

    return json.jsonify(**data)

