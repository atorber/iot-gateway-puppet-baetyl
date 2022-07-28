FROM node:16
WORKDIR ./
COPY package.json ./
RUN npm install
COPY . .
COPY .env .
CMD [ "npm","run", "start" ]
