# syntax=docker/dockerfile:1

# ==============================================================================
# Hardened Unprivileged Nginx Release Runtime
# Serves pre-built Astro + React static assets (dist/) with zero development artifacts.
# ==============================================================================
FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime

# The entrypoint renders /etc/nginx/templates/*.template with envsubst to /tmp
ENV NGINX_ENVSUBST_OUTPUT_DIR=/tmp

USER root
RUN rm -f /etc/nginx/conf.d/default.conf

# Nginx configurations & validation entrypoint
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx/snippets /etc/nginx/snippets
COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --chmod=0555 docker/entrypoint/05-require-env.sh /docker-entrypoint.d/05-require-env.sh

# Copy only the compiled release distribution
COPY dist /usr/share/nginx/html

# Run as unprivileged nginx user (UID 101)
USER 101

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]