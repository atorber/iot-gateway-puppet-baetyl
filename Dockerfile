FROM node:16.18.1-alpine

WORKDIR /usr/src/app

COPY . .

# COPY package.json ./

RUN npm install

CMD [ "node","src/index.js" ]