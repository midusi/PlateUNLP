from flask import request, json, Response, abort, current_app as app
import os
import cv2
import torch
import time

from app.helpers.forms import PredictForm


def api_predict():

    form = PredictForm(obj=request.json, meta={'csrf': False}, id=None)

    if not form.validate_on_submit():
        abort(400)

    img_name = form.img_name.data
    img_path = form.img_path.data

    image_path = os.path.join(img_path, img_name)
    
    if not (img_name.split(sep='.')[-1] == 'png'):
        image_path = os.path.join(img_path, app.config['PNG_FOLDER'], img_name+'.jpg')

    # Maximum time to validate that the file exists
    maxTime = 0
    while not os.path.exists(image_path) and maxTime < 60:
        maxTime = maxTime + 1
        time.sleep(1)

    # test
    print(image_path)

    # size training
    width = 512
    height = 512
    dsize = (width, height)

    img = cv2.imread(image_path)
    original_height, original_width, _ = img.shape

    # size ratio between original and training image
    proportional_width = original_width / width
    proportional_height = original_height / height

    # preprocesing
    output = cv2.resize(img, dsize, interpolation=cv2.INTER_AREA)

    # create yolo model
    model_path = os.path.join(app.static_folder, 'models', "best.pt")
    yolov5_path = os.path.join(app.static_folder, 'yolov5')
    model = torch.hub.load(yolov5_path, 'custom',
                           path=model_path, source='local')

    # inference
    detections = model(output, size=width)

    # results
    print(detections.pandas().xyxy[0])

    # inference processing
    results = detections.pandas().xyxy[0].to_dict(orient="records")
    bboxs = []
    for result in results:
        # con = result['confidence']
        # cs = result['class']
        x1 = int(result['xmin']) * proportional_width
        y1 = int(result['ymin']) * proportional_height
        x2 = int(result['xmax']) * proportional_width
        y2 = int(result['ymax']) * proportional_height
        img_width = x2 - x1
        img_heigth = y2 - y1

        bboxs.append({'x': (2 * x1 + img_width) / (2 * original_width),
                      'y': (2 * y1 + img_heigth) / (2 * original_height),
                      'w': img_width / original_width,
                      'h': img_heigth / original_height})

    # api response data
    data = {
        "predictions": bboxs
    }

    return json.jsonify(**data)
