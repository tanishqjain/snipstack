# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

RUN npm install
RUN npm run build -w packages/shared
RUN npm run build -w apps/web

# Nginx stage
FROM nginx:alpine

# Custom nginx config
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Handle React Router
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://api:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
