FROM nginx:1.11
MAINTAINER Akvo Foundation <devops@akvo.org>

RUN apt-get update && \
    apt-get install -y -q --no-install-recommends curl xz-utils && \
    apt-get install -y -q --no-install-recommends libcairo2-dev libjpeg62-turbo-dev libpango1.0-dev libgif-dev build-essential g++ && \
    apt-get install -y -q --no-install-recommends python && \
    curl https://nodejs.org/dist/v5.7.0/node-v5.7.0-linux-x64.tar.xz | tar -xJf - --strip-components=1 -C /usr && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY . /tmp/lumen/
COPY default.conf /etc/nginx/conf.d/default.conf

RUN cd /tmp/lumen/ && \
    npm set progress=false && \
    npm install && \
    npm rebuild node-sass && \
    npm run build && \
    mkdir /usr/share/nginx/html/assets && \
    cp dist/* /usr/share/nginx/html/assets && \
    mv /usr/share/nginx/html/assets/index.html /usr/share/nginx/html/index.html && \
    mv /usr/share/nginx/html/assets/index-pub.html /usr/share/nginx/html/index-pub.html && \
    cd /tmp && rm -rf lumen
