(ns org.akvo.dash.transformation)

(defn- valid?
  [transformations]
  true)

(defn schedule
  [tenant-conn transformations]
  (if (valid? transformations)
    {:status 200
     :body "job-id"}
    {:status 400
     :body "Bad request"}))
