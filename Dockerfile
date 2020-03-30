FROM node:12.16.1

WORKDIR /usr/src/app

COPY package.json .

RUN npm install

RUN npm install gulp-cli -g

COPY . .

EXPOSE 4000
    
CMD [ "gulp", "serve" ]