FROM node:20-alpine

WORKDIR /app

# Install dependencies for Prisma, bcrypt, and netcat
RUN apk add --no-cache openssl python3 make g++ netcat-openbsd

COPY package*.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN npx prisma generate

CMD ["./start.sh"]
