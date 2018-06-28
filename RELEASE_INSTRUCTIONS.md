# Release instructions

Develop & master branch
Dark and light
Kubernetes secrets
linux
Env vars



## Github release

##


 docker exec -i -t akvo-lumen_backend_1 env ENCRYPTION_KEY=... KC_URL=... KC_SECRET=... PG_HOST=... PG_DATABASE=... PG_USER=... PG_PASSWORD=... lein run -m akvo.lumen.admin.add-tenant "https://demo.akvolumen.org" "demo" daniel@akvo.org

docker exec -i -t akvo-lumen_backend_1 env ENCRYPTION_KEY=... KC_URL=... KC_SECRET=... PG_HOST=... PG_DATABASE=... PG_USER=... PG_PASSWORD=... lein run -m akvo.lumen.admin.new-plan demo unlimited
