#!/bin/bash

set -e

cat <<- EOF > .env
	HOST_UID=$(id -u)
	HOST_GID=$(id -g)
EOF
