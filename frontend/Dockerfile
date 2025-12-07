FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm config set fetch-retry-maxtimeout 600000 \
    && npm config set fetch-retry-mintimeout 10000 \
    && npm install

COPY . .

CMD ["npm", "run", "dev", "--", "--host"]
