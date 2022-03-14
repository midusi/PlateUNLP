from app.helpers import handler


def set_routes(app):
    # Handlers
    app.register_error_handler(400, handler.bad_request_error)
    app.register_error_handler(500, handler.internal_server_error)
    app.register_error_handler(404, handler.not_found_error)
    app.register_error_handler(405, handler.not_found_error)
    app.register_error_handler(401, handler.unauthorized_error)
    app.register_error_handler(403, handler.forbidden_error)
    # Implementar lo mismo para el error 500 y 401
