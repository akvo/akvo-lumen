(ns dev.admin
  (:require
   [akvo.lumen.admin.system :as admin.system]
   [dev.commons :as commons]
   [akvo.lumen.admin.db :as admin.db]
   [akvo.lumen.admin.add-tenant :as add-tenant]
   [akvo.lumen.admin.remove-tenant :as remove-tenant]))

(def ^:dynamic prod-edn "akvo/lumen/prod.edn")
(def ^:dynamic dev-edn "local-admin.edn")

(defn exec
  [prod? remove? & [url email title]]
  (let [[ks edn-file] (if prod?
                        [(do (admin.system/ig-derives)
                             (admin.system/ig-select-keys
                              [:akvo.lumen.admin/remove-tenant
                               :akvo.lumen.component.error-tracker/config
                               :akvo.lumen.component.error-tracker/prod
                               :akvo.lumen.admin/add-tenant])) prod-edn]
                        [(do (derive :akvo.lumen.utils.dev-emailer/emailer :akvo.lumen.component.emailer/emailer)
                             (derive :akvo.lumen.utils.local-error-tracker/local :akvo.lumen.component.error-tracker/error-tracker)
                             [:akvo.lumen.utils.dev-emailer/emailer
                              :akvo.lumen.utils.local-error-tracker/local
                              :akvo.lumen.admin.db/config
                              :akvo.lumen.admin/remove-tenant
                              :akvo.lumen.admin/add-tenant
                              ]) dev-edn])
        c* (commons/config ["akvo/lumen/config.edn" "akvo/lumen/admin.edn" "test.edn" edn-file] prod?)
        s (admin.system/new-system c* ks)
        admin-add-tenant (:akvo.lumen.admin/add-tenant s)
        admin-remove-tenant (:akvo.lumen.admin/remove-tenant s)]
      (let [encryption-key (-> admin-add-tenant :db-settings :encryption-key)
            drop-if-exists? (-> admin-add-tenant :drop-if-exists?)
            label (add-tenant/label url)
            email (or email "juan@akvo.org")
            url url
            title (or title (str "title-" label ))]
        (if remove?
          (remove-tenant/exec admin-remove-tenant label)
          (add-tenant/exec admin-add-tenant {:url url :title title :email email})))))

(comment
  "running with other settings file"
  (binding [prod-edn "dark.edn"]
    (exec true true "https://juan.akvolumen.org"))
  )


