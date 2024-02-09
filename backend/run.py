import os
from app import create_app

os.environ['FLASK_DEBUG'] = 'development'

if __name__ == "__main__":
    app = create_app()
    app.run(host='localhost', port=20500)