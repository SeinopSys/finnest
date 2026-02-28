FROM node:24-alpine AS builder

WORKDIR /app

COPY . .

RUN npm ci

RUN npx prisma generate

RUN npm run build

CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run serve"]
