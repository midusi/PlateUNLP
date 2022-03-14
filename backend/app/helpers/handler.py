from flask import render_template


def not_found_error(e):
    kwargs = {
        "error_code": 404,
        "error_description": "El servidor no pudo encontrar el contenido solicitado",
    }
    return "error 404"


def unauthorized_error(e):
    kwargs = {
        "error_code": 401,
        "error_description": "No está autorizado para acceder al recurso solicitado",
    }
    return "error 401"


def forbidden_error(e):
    kwargs = {
        "error_code": 403,
        "error_description": "No tienes permiso para esto",
    }
    return "error 403"


def bad_request_error(e):
    kwargs = {
        "error_code": 400,
        "error_description": "Uno de los parámetros especificados en la solicitud no es válido.",
    }
    return "error 400"


def internal_server_error(e):
    kwargs = {
        "error_code": 500,
        "error_description": "Uno de los parámetros especificados en la solicitud no es válido.",
    }
    return "error 500"
