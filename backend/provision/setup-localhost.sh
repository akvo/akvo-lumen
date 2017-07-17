#!/usr/bin/env bash

update-localhost() {
    # Out with the old
    sudo sed -i '' '/dash.akvo.org$/d' /etc/hosts

    # In with the new
    sudo /bin/bash -c "echo '127.0.0.1 t1.lumen.localhost' >> /etc/hosts"
    sudo /bin/bash -c "echo '127.0.0.1 t2.lumen.localhost' >> /etc/hosts"
    sudo /bin/bash -c "echo '127.0.0.1 auth.lumen.localhost' >> /etc/hosts"
}

update-localhost
