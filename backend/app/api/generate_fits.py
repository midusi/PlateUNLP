from flask import request, json, Response, abort, current_app as app
from astropy.io import fits
import os
import cv2

def api_generate_fits():

    img_name = request.json["img_name"]
    path_dir = request.json["path_dir"]
    bbox_arr = request.json["bbox_arr"]
    data_arr = request.json["data_arr"]
    fields = request.json["fields"]

    image_path = os.path.join(path_dir, img_name)
    img_name = img_name[0:img_name.rfind(".")];

    # test
    print(image_path)
    print("image path",image_path)

    # generate dir output
    output_path = os.path.join(path_dir, "output")
    if not (os.path.exists(output_path)):
        os.mkdir(output_path)
    print(output_path)

    # cropped
    for bbox,data in zip(bbox_arr,data_arr):
        bbox.pop('id', None)
        bbox.pop('color', None)
        
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
        
        # crop image
        crop_img = img[y:y+h, x:x+w]
        crop_img = crop_img[:,:]
        if(rotated):
            crop_img = cv2.rotate(crop_img,cv2.ROTATE_90_COUNTERCLOCKWISE)
        # saved image crop
        cv2.imwrite(os.path.join(output_path, f'{img_name}_{data["OBJECT"]}.png'),crop_img)

        # generated fit
        prihdr = fits.Header()
        for key in fields.keys():
            comment = ''
            if 'info' in fields[key].keys():
                comment = fields[key]["info"]
            prihdr[key] = (data[key], comment)
        print('Format to Save', crop_img.dtype)
        print("PRI HDR: ---->",prihdr)
        fits.writeto(
            (os.path.join(output_path, f'{img_name}_{data["OBJECT"]}.fits')), crop_img, prihdr, clobber=True)

    # api response data
    data = {
        "status": True
    }

    return json.jsonify(**data)