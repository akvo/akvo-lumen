#!/usr/bin/env bash

set -e

sudo /bin/bash -c "echo '127.0.0.1 t1.lumen.localhost' >> /etc/hosts"
sudo /bin/bash -c "echo '127.0.0.1 t2.lumen.localhost' >> /etc/hosts"
sudo /bin/bash -c "echo '127.0.0.1 auth.lumen.localhost' >> /etc/hosts"
sudo /bin/bash -c "echo '127.0.0.1 postgres' >> /etc/hosts"