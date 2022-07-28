FROM node:16

WORKDIR /usr/src/app

COPY . /usr/src/app

RUN npm install

CMD [ "node","src/index.js" ]
