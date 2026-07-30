FROM node:22-alpine AS builder

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM openresty/openresty:alpine AS runtime

COPY docker/nginx.conf /usr/local/openresty/nginx/conf/nginx.conf
COPY --from=builder /build/dist /usr/local/openresty/nginx/html

EXPOSE 8080

CMD ["openresty", "-g", "daemon off;"]
