# pull official base image
#FROM node:16.17.1
FROM node:18-alpine AS external-website

# set work directory
WORKDIR /usr/src/app/

# copy project
COPY . .

# install dependencies
RUN npm install

# run container
# CMD [ "npm", "run", "dev" ]