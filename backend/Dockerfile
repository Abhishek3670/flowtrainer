FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY ./src ./src
COPY .env.example .env

RUN npm run build

EXPOSE 4000

CMD ["node", "dist/server.js"]
