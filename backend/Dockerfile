# pull official base image
FROM python:3.8.17-slim-bullseye

# set work directory
WORKDIR /usr/src/app

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# install system dependencies
RUN apt-get update && apt-get install -y netcat
RUN apt-get install -y build-essential
RUN apt-get install -y libgl1-mesa-glx
RUN apt-get install -y libglib2.0-0

# install dependencies
RUN pip install --upgrade pip
COPY ./requirements.txt /usr/src/app/requirements.txt
RUN pip install -r requirements.txt
RUN pip install --upgrade flask werkzeug
RUN pip install --upgrade Flask-WTF

# copy project
COPY . /usr/src/app/

# run entrypoint.sh
# ENTRYPOINT ["/usr/src/app/entrypoint.sh"] # No tengo DB con la que conectar