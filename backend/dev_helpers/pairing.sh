#!/usr/bin/env bash

set -eu

apt-get update
apt-get install -y emacs-nox tmate silversearcher-ag

mkdir -p /home/akvo/.emacs.d/
mkdir -p /home/akvo/.ssh/
mkdir -p /root/.emacs.d/
mkdir -p /root/.ssh/
cp /app/dev_helpers/init.el /home/akvo/.emacs.d/init.el
cp /app/dev_helpers/init.el /root/.emacs.d/init.el

{
    echo "export PATH=/usr/local/openjdk-11/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/local/bin/"
    echo "[[ -d ~/.ssh ]] || mkdir ~/.ssh"
    echo "[[ -f ~/.ssh/id_rsa ]] || ssh-keygen -t rsa -b 4096 -P '' -f ~/.ssh/id_rsa"

} >> /home/akvo/.bashrc

{
    echo "export PATH=/usr/local/openjdk-11/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/local/bin/"
    echo "[[ -d ~/.ssh ]] || mkdir ~/.ssh"
    echo "[[ -f ~/.ssh/id_rsa ]] || ssh-keygen -t rsa -b 4096 -P '' -f ~/.ssh/id_rsa"

} >> /root/.bashrc

[[ -f /app/.dir-locals.el ]] && mv /app/.dir-locals.el /app/.dir-locals.el.bk

chown -R akvo:akvo /home/akvo/

/app/wait-for-dependencies.sh

run-as-user.sh tmate
