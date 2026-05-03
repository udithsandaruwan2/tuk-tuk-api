FROM node:20-slim

# Prisma needs OpenSSL libs; slim image omits them by default.
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate

COPY . .

EXPOSE 8000

CMD ["node", "src/index.js"]
