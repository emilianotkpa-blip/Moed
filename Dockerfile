# Sitio de MOËD — archivos estaticos servidos con nginx.
# Lo que se publica es la raiz del repo (index.html, _astro/, editor.js...);
# fuente/ y los documentos quedan fuera por .dockerignore.
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html
# La configuracion no se sirve como archivo del sitio
RUN rm -f /usr/share/nginx/html/nginx.conf
EXPOSE 80
