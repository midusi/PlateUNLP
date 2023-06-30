# pull official base image
# FROM node:16.17.1
FROM node:18

# set work directory
WORKDIR /usr/src/app/

# copy dependencies
COPY ./package*.json .

# install dependencies
#RUN npm install -g rollup
RUN npm install

# copy project
COPY . .

EXPOSE 5000
ENV HOST=0.0.0.0

# run container
# CMD [ "npm", "run", "dev" ]