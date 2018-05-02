FROM nginx:1.13.8-alpine
MAINTAINER Akvo Foundation <devops@akvo.org>

COPY default.conf /etc/nginx/conf.d/default.conf
COPY favicon.ico /usr/share/nginx/html/favicon.ico
COPY dist/* /usr/share/nginx/html/assets/
COPY dist/index.html /usr/share/nginx/html/index.html
COPY dist/index-pub.html /usr/share/nginx/html/index-pub.html
