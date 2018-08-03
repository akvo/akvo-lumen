FROM cypress/base:8

RUN set -ex; \
    apt-get update && apt-get install -y --no-install-recommends \
    runit && \
    rm -rf /var/lib/apt/lists/* && \
    useradd -d /home/akvo -m -s /bin/bash akvo

RUN mkdir /app

COPY package* /app/

RUN chown -R akvo:akvo /app

WORKDIR /app

USER root
RUN npm i -g npm

USER akvo
RUN npm i cypress --quiet && npm run cypress:verify

USER root
