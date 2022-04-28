
from app.api import predict
from app.api import generate_fits
from app.api import get_metadata
   
def set_routes(app):
    app.add_url_rule("/api/predict", "api_predict",
                     predict.api_predict, methods=["POST"])
    app.add_url_rule("/api/generatefits", "api_generate_fits",
                     generate_fits.api_generate_fits, methods=["POST"])
    app.add_url_rule("/api/getMetadata", "api_get_metadata",
                     get_metadata.api_get_metadata, methods=["POST"])