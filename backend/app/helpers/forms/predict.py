from flask_wtf import FlaskForm
from wtforms import StringField
from wtforms.validators import DataRequired, Length


class PredictForm(FlaskForm):

    img_name = StringField("image name", validators=[
                           DataRequired(), Length(min=2, max=64)])
    img_path = StringField("directory path", validators=[
                           DataRequired(), Length(min=4, max=64)])
