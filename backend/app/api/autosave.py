from flask import jsonify, Blueprint, request;
import os
import base64
import cv2

autosave_api = Blueprint("autosave", __name__, url_prefix="/api/autosave")

@autosave_api.post("/")
def save():

     # api response messaje
    message = {
        "Esto es solo una prueba": "gg",
        "Ojala": "Haya salido bien"
    }
    resp = jsonify(message)
    resp.status_code = 200
    return resp
