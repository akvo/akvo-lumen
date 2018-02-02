#!/usr/bin/env bash

set -eu

USER_EXISTS=$(awk -F ':' '$3 ~ /^'${HOST_UID}'$/' /etc/passwd)
GROUP_EXISTS=$(awk -F ':' '$3 ~ /^'${HOST_GID}'$/' /etc/group)

if [ -z "${GROUP_EXISTS}" ]; then
    addgroup --gid "${HOST_GID}" akvo
else
    sed -i -e "s/\(.*\):\(.*\):${HOST_GID}:\(.*\)/akvo:\2:${HOST_GID}:\3/" /etc/group
fi

if [ -z "${USER_EXISTS}" ]; then
    useradd --home /home/akvo \
	    --no-create-home \
	    --password akvo \
	    --shell /bin/bash \
	    --gid "${HOST_GID}" \
	    --uid "${HOST_UID}" \
	    akvo
else
    sed -i -e "s|^\(.*\):\(.*\):${HOST_UID}:\(.*\)$|akvo:x:${HOST_UID}:${HOST_UID}:akvo:/home/akvo:/bin/bash|" /etc/passwd
fi

gosu akvo "$@"
