#!/bin/sh

set -eu

USER_EXISTS=$(awk -F ':' '$3 ~ /^'${HOST_UID}'$/' /etc/passwd)
GROUP_EXISTS=$(awk -F ':' '$3 ~ /^'${HOST_GID}'$/' /etc/group)

if [ -z "${GROUP_EXISTS}" ]; then
    addgroup -g "${HOST_GID}" akvo
else
    sed -i -e "s/\(.*\):\(.*\):${HOST_GID}:\(.*\)/akvo:\2:${HOST_GID}:\3/" /etc/group
fi

if [ -z "${USER_EXISTS}" ]; then
    adduser -h /home/akvo \
	    -s /bin/sh \
	    -G akvo \
	    -D \
	    -u "${HOST_UID}" \
	    akvo
else
    sed -i -e "s|^\(.*\):\(.*\):${HOST_UID}:\(.*\)$|akvo:x:${HOST_UID}:${HOST_UID}:akvo:/home/akvo:/bin/bash|" /etc/passwd
fi

su-exec akvo "$@"
