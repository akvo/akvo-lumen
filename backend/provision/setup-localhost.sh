#!/usr/bin/env bash

update-localhost() {
    # Out with the old
    sudo sed -i '' '/dash.akvo.org$/d' /etc/hosts

    # In with the new
    sudo /bin/bash -c "echo '127.0.0.1 *.dash.localhost' >> /etc/hosts"
}

update-localhost
