FROM node:24-alpine as builder

WORKDIR /app

COPY app2-fe/package.json .
RUN npm install

COPY app2-fe/ .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]