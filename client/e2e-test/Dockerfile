FROM cypress/base:8
RUN npm install npm -g

RUN set -ex; \
    apt-get update && apt-get install -y --no-install-recommends \
    runit && \
    rm -rf /var/lib/apt/lists/* && \
    useradd -d /home/akvo -m -s /bin/bash akvo

WORKDIR /app
CMD ./run.sh