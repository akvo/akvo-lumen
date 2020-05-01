#!/usr/bin/env bash

set -eu

[[ ! -f "./docker-compose.yml" ]] && { echo "Execute ${0##*/} from project top folder"; exit 1; }

docker-compose exec -T postgres \
	       sed -i \
	       -e "s/^#log_destination/log_destination/" \
	       -e "s/^#log_min_error_statement = error/log_min_error_statement = info/" \
	       -e "s/^#log_min_duration_statement = -1/log_min_duration_statement = 0/" \
	       -e "s/^#log_min_messages = warning/log_min_messages = info/" \
	       /var/lib/postgresql/data/postgresql.conf

docker-compose restart postgres

docker-compose restart backend
