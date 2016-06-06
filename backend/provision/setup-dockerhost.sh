#!/usr/bin/env bash

update-docker-host() {
    # Expects to be running on the default docker-machine "machine"
    export DOCKER_IP=$(docker-machine ip default)

    # Out with the old
    sudo sed -i '' '/[[:space:]]t1.lumen.akvo.org$/d' /etc/hosts
    sudo sed -i '' '/[[:space:]]t2.lumen.akvo.org$/d' /etc/hosts

    # In with the new
    [[ -n $DOCKER_IP ]] && sudo /bin/bash -c "echo \"${DOCKER_IP} t1.lumen.akvo.org\" >> /etc/hosts"
    [[ -n $DOCKER_IP ]] && sudo /bin/bash -c "echo \"${DOCKER_IP} t2.lumen.akvo.org\" >> /etc/hosts"

}

update-docker-host
