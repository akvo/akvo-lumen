# Setup new tenant


```shell
kubcetl gcloud container clusters get-credentials <KUBERNETES_ENV> --zone europe-west1-d --project akvo-lumen \
  && kubectl exec <POD_ID> -c lumen-backend -- java -cp akvo-lumen.jar clojure.main -m akvo.lumen.admin.add-tenant <FULL_TENANT_URL> <TENANT_TITLE> <ADMIN_EMAIL>
```

*Don't forget to add protocol* to `<FULL_TENANT_URL>`, that's to say `https://`

Example in test env: 

```shell
kubcetl gcloud container clusters get-credentials test --zone europe-west1-d --project akvo-lumen \
  && kubectl exec <POD_ID> -c lumen-backend -- java -cp akvo-lumen.jar clojure.main -m akvo.lumen.admin.add-tenant https://testing.akvotest.org testing juan@akvo.org

```

# Remove existent tenant

```shell
kubcetl gcloud container clusters get-credentials <KUBERNETES_ENV> --zone europe-west1-d --project akvo-lumen \
  && kubectl exec <POD_ID> -c lumen-backend -- java -cp akvo-lumen.jar clojure.main -m akvo.lumen.admin.remove-tenant <TENANT_LABEL>

```

Example in test env:
```shell
kubcetl gcloud container clusters get-credentials test --zone europe-west1-d --project akvo-lumen \
  && kubectl exec POD_ID -c lumen-backend -- java -cp akvo-lumen.jar clojure.main -m akvo.lumen.admin.remove-tenant testing

```

