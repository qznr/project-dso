FROM node:24-alpine

WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma/ ./prisma/ 

RUN npm install --omit=dev
COPY . .

RUN npx prisma generate

RUN adduser -D appuser
USER appuser

EXPOSE 3000

CMD ["node", "index.js"]