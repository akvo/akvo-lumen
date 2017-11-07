docker-compose up &
BACKEND=""
CLIENT=""
while [ -z "$BACKEND" ] ; do
  echo "Waiting for backend to start."
  sleep 1;
  BACKEND=$(echo sanpedro43 | sudo -S lsof -Pi :3000 -sTCP:LISTEN -t)
done &
wait $!
while [ -z "$CLIENT" ]; do
  echo "ESPERANDO CLIENTE"
  sleep 1;
  CLIENT=$(sudo lsof -Pi :3030 -sTCP:LISTEN -t)
done &
wait $!
docker run --interactive --tty --shm-size 1G --rm --network=akvolumen_default \
-v "$PWD/client/ui-test/script-test.js":/app/index.js --link akvolumen_client_1:t1.lumen.local \
--link akvolumen_keycloak_1:auth.lumen.local --link akvolumen_client_1:t1.lumen.local \
--link akvolumen_keycloak_1:auth.lumen.local --sysctl net.ipv6.conf.all.disable_ipv6=1 alekzonder/puppeteer:latest
