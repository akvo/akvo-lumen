# Setup new tenant

Run the ci/new-instance.sh

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

