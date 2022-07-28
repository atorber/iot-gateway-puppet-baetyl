FROM node:16

WORKDIR /usr/src/app

COPY . .

# COPY package.json ./

RUN npm install

CMD [ "node","src/index.js" ]