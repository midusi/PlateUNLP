
from app.api import all_paths
from app.api import config
from app.api.resources import resources_api
   
def set_routes(app):
    app.add_url_rule("/api/allPaths", "api_all_paths",
                     all_paths.api_all_paths)
    app.add_url_rule("/api/saveConfig", "api_save_config",
                     config.api_save_config, methods=["POST"])
    app.add_url_rule("/api/loadConfig", "api_load_config",
                     config.api_load_config)
    
    #registro usando Blueprints
    app.register_blueprint(resources_api)