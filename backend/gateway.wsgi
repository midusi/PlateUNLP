activate_this = 'env/bin/activate_this.py'
with open(activate_this) as file_:
    exec(file_.read(), dict(__file__=activate_this))

from app import create_app

if __name__ == "__main__":
    app = create_app()
    app.run(host='localhost', port=20500)
