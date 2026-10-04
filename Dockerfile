# syntax=docker/dockerfile:1

# ---- Stage 1: Build static Astro MPA & PWA -------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
ENV ASTRO_TELEMETRY_DISABLED=1 CI=true

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Stage 2: Hardened Unprivileged Nginx Runtime ------------------------------
FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime

# The entrypoint renders /etc/nginx/templates/*.template with envsubst to /tmp
ENV NGINX_ENVSUBST_OUTPUT_DIR=/tmp

USER root
RUN rm -f /etc/nginx/conf.d/default.conf
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx/snippets /etc/nginx/snippets
COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --chmod=0555 docker/entrypoint/05-require-env.sh /docker-entrypoint.d/05-require-env.sh
COPY --from=build /app/dist /usr/share/nginx/html
USER 101

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]