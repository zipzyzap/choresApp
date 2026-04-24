FROM node:20-alpine

WORKDIR /app

COPY package.json .

RUN npm install

EXPOSE 3000

CMD ["npx", "nodemon", "--watch", "private", "--watch", "public", "private/server.js"]