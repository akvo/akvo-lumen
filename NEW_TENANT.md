# Setup new tenant

When creating a new tenant, make sure to be at the corresponding branch to not
get into issues. For production, make sure to be on the master branch!

Creating a new tenant consists on one script ([akvo.lumen.admin.add-tenant](https://github.com/akvo/akvo-lumen/blob/master/backend/src/akvo/lumen/admin/add_tenant.clj). This script needs inputs (secrets & configs). The script
includes comments on what env vars are needed and where to find them. Since there is issues running the script on a Mac (because of the encryption library used) we run the script on our docker container.

## To create a new tenant
```
$ docker-compose exec backend run-as-user.sh env LUMEN_ENCRYPTION_KEY=... LUMEN_KEYCLOAK_URL=... LUMEN_KEYCLOAK_CLIENT_SECRET=... LUMEN_EMAIL_PASSWORD=... LUMEN_EMAIL_USER=... PG_HOST=... PG_DATABASE=... PG_USER=... PG_PASSWORD=... lein run -m akvo.lumen.admin.add-tenant "<FULL TENANT URL>" "<TENANT TITLE>" "<ADMIN EMAIL>" "<OPTIONAL AUTH TYPE>" "<OPTIONAL EDN FILE PATH>"
```
- LUMEN_KEYCLOAK_URL ends in /auth e.g: https://login.akvo.org/auth
- LUMEN_ENCRYPTION_KEY is a key specific for the Kubernetes environment used for encrypting the db_uri which can be found in the lumen secret in K8s.
Obtain it by first switch to correct gcloud env. For example:
```
$ gcloud container clusters get-credentials production --zone europe-west1-d --project akvo-lumen
```
Then (on mac):
```
$ kubectl get secret lumen -o yaml | grep 'encryption_key' | awk -F': ' '{print $2}' | base64 -D
```
(linux):
```
$ kubectl get secret lumen -o yaml | grep 'encryption_key' | awk -F': ' '{print $2}' | base64 -d
```


More details in which values should we use for `KC_URL` and `KC_SECRET` can be found in [akvo.lumen.admin.add-tenant](https://github.com/akvo/akvo-lumen/blob/master/backend/src/akvo/lumen/admin/add_tenant.clj). You'll need to access [Keycloak admin console](https://login.akvo.org/auth/admin/akvo/console/)  to get `KC_SECRET`


For `PG_HOST`,  `PG_DATABASE`, `PG_USER` and `PG_PASSWORD` go to [elephantsql](https://customer.elephantsql.com/login), click in `lumen-prod` or `lumen-dev` and following screen will show you the proper values. 


*Don't forget to add protocol* to `<FULL TENANT URL>`, that's to say `http://` or `https://`
