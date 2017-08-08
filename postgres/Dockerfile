FROM mdillon/postgis:9.6

ADD ./provision /docker-entrypoint-initdb.d/

# For logging
## TODO: remove???
COPY pg.config /usr/share/postgresql/9.6/postgresql.conf.sample