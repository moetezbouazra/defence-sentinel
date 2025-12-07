FROM node:20-alpine

WORKDIR /app

# Install dependencies for Prisma and bcrypt
RUN apk add --no-cache openssl python3 make g++

COPY package*.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN npx prisma generate

CMD ["yarn", "dev"]
