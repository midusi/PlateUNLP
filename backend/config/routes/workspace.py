
from app.api import all_paths
from app.api import get_img
from app.api import config
   
def set_routes(app):
    app.add_url_rule("/api/allPaths", "api_all_paths",
                     all_paths.api_all_paths)
    app.add_url_rule("/api/getImg", "api_get_img",
                     get_img.api_get_img)
    app.add_url_rule("/api/saveConfig", "api_save_config",
                     config.api_save_config, methods=["POST"])
    app.add_url_rule("/api/loadConfig", "api_load_config",
                     config.api_load_config)