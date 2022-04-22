from flask import request, json, Response, abort, current_app as app
from astropy.io import fits
import os
import cv2

def api_generate_fits():

    img_name = request.json["img_name"]
    path_dir = request.json["path_dir"]
    bbox_arr = request.json["bbox_arr"]
    fields = request.json["fields"]

    image_path = os.path.join(path_dir, img_name)
    img_name = img_name[0:img_name.rfind(".")];

    # test
    print(image_path)
    print(image_path)

    # generate dir output
    output_path = os.path.join(path_dir, "output")
    if not (os.path.exists(output_path)):
        os.mkdir(output_path)
    print(output_path)

    # cropped
    for bbox in bbox_arr:
        bbox.pop('id', None)
        bbox.pop('color', None)
        
        # The flag to -1 loads the image as is
        img = cv2.imread(image_path, -1)
        original_height, original_width = img.shape
        if (original_width > original_height):
            img = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
        x = int(bbox["x"])
        y = int(bbox["y"])
        w = int(bbox["w"])
        h = int(bbox["h"])

        # crop image
        crop_img = img[y:y+h, x:x+w]
        crop_img = crop_img[:,:]

        # saved image crop
        cv2.imwrite(os.path.join(output_path, f'{img_name}_{bbox["OBJECT"]}.png'), crop_img)

        # generated fit
        prihdr = fits.Header()
        for key in fields.keys():
            comment = ''
            if 'info' in fields[key].keys():
                comment = fields[key]["info"]
            prihdr[key] = (bbox[key], comment)
        print('Format to Save', crop_img.dtype)
        fits.writeto(
            (os.path.join(output_path, f'{img_name}_{bbox["OBJECT"]}.fits')), crop_img, prihdr, clobber=True)

    # api response data
    data = {
        "status": True
    }

    return json.jsonify(**data)
