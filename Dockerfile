FROM nginx:alpine

# Site CK completo. O exercício da Aula 22 usa o Dockerfile em
# atividade-docker/site-aula2, com apenas FROM e COPY do index.html.
COPY index.html style.css script.js /usr/share/nginx/html/
COPY midia/ /usr/share/nginx/html/midia/
COPY apresentacao/ /usr/share/nginx/html/apresentacao/
COPY apresentacao-projeto/ /usr/share/nginx/html/apresentacao-projeto/
