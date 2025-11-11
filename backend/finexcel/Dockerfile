FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate

ENV NODE_ENV=development
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:dev"]