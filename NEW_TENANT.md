# Setup new tenant

Run `ci/new-instance.sh`

If you get this error:

`ERROR: (gcloud.container.clusters.get-credentials) ResponseError: code=403, message=Required "container.clusters.get" permission(s) for `

run:
`gcloud auth login` and login in the browser.

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

