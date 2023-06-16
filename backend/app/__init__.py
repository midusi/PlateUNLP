from flask import Flask
from smallthon import sm_list
from flask_cors import CORS

from config.routes import set_routes

# Initial configuration of the app
app = Flask(__name__)

# Add Cors
CORS(app)

sm_list()

# Folder where tif conversions to PNG are stored
app.config['PNG_FOLDER'] = ".train"

# Set the routes that the app possesses
set_routes(app)
