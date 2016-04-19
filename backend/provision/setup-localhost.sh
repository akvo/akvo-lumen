#!/usr/bin/env bash

update-localhost() {
    # Out with the old
    sudo sed -i '' '/[[:space:]]t1.dash.akvo.org$/d' /etc/hosts
    sudo sed -i '' '/[[:space:]]t2.dash.akvo.org$/d' /etc/hosts

    # In with the new
    sudo /bin/bash -c "echo \"127.0.0.1 t1.dash.akvo.org\" >> /etc/hosts"
    sudo /bin/bash -c "echo \"127.0.0.1 t2.dash.akvo.org\" >> /etc/hosts"
}

update-localhost
