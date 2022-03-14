
from . import main
from . import handler
from . import spectrum
from . import workspace


def set_routes(app):

    main.set_routes(app)
    handler.set_routes(app)
    spectrum.set_routes(app)
    workspace.set_routes(app)
