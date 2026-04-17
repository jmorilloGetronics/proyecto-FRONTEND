FROM nginx:1.27-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY index.html /usr/share/nginx/html/
COPY catalogo.html /usr/share/nginx/html/
COPY motos.html /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/

RUN chown -R appuser:appgroup /usr/share/nginx/html \
    && chmod -R 755 /usr/share/nginx/html \
    && chown -R appuser:appgroup /var/cache/nginx \
    && chown -R appuser:appgroup /var/run \
    && chown -R appuser:appgroup /var/log/nginx \
    && touch /run/nginx.pid \
    && chown appuser:appgroup /run/nginx.pid

USER appuser

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
