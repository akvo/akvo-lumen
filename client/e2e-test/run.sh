echo "running cypress against $LUMEN_URL"


echo "About to run docker-compose check"
docker-compose ps
docker-compose logs backend
echo "ran docker-compose check"

if [ -z "${CYPRESS_RECORD_KEY}" ]; then
    npm run cypress:run
else
    npm run cypress:run -- --record
fi
