FROM node:18

# set work directory
WORKDIR /usr/src/app/

# copy project
COPY . .

# install dependencies
RUN npm install

EXPOSE 5000
ENV HOST=0.0.0.0