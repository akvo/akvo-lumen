#!/bin/sh
sleep 10

wget -qO- www.google.com
echo 
echo 
echo 
wget -qO- http://localhost:3030/index.html
echo 
echo 
echo 
wget -qO- http://localhost:3030/assets/index-pub.html