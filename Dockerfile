FROM node:22-alpine AS builder
WORKDIR /app

ARG VITE_API_URL
ARG VITE_API_GMKEY
ARG VITE_BASE_URL
ARG VITE_TEST_EMAIL
ARG VITE_TEST_PASSWORD

# 2. Transformamos o argumento em variável de ambiente para o Vite usar
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_GMKEY=$VITE_API_GMKEY
ENV VITE_BASE_URL=$VITE_BASE_URL
ENV VITE_TEST_EMAIL=$VITE_TEST_EMAIL
ENV VITE_TEST_PASSWORD=$VITE_TEST_PASSWORD

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Estágio 2: Servidor de produção
FROM nginx:alpine
# Copia os arquivos estáticos gerados pelo Vite para o diretório do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuração simples para SPA (Single Page Application) não dar 404 ao atualizar rotas
RUN echo 'server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]