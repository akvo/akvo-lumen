(ns akvo.lumen.endpoint.flow-test
  (:require [clojure.test :refer :all]
            [ring.mock.request :as mock]
            [akvo.lumen.endpoint.flow :as flow]
            [akvo.lumen.lib.flow-impl :as flow-impl]))

(comment
  (require 'clojure.tools.namespace.repl)
  (clojure.tools.namespace.repl/refresh))


(def folders-and-surveys
  [;; Root folders and surveys
   {:id 1000 :folderId 0 :title "Folder A" :type "folder"}
   {:id 1001 :folderId 0 :title "Folder B" :type "folder"}
   {:id 1002 :folderId 0 :title "Survey C" :type "survey"}

   ;; Folder A's sub folders and surveys
   {:id 1003 :folderId 1000 :title "Folder AA" :type "folder"}
   {:id 1004 :folderId 1000 :title "Folder AB" :type "folder"}
   {:id 1005 :folderId 1000 :title "Folder AC" :type "folder"}
   {:id 1006 :folderId 1000 :title "Survey A1" :type "survey"}

   ;; Folder AA's sub folder
   {:id 1007 :folderId 1003 :title "Folder AAA" :type "folder"}

   ;; Folder AB's sub survey
   {:id 1008 :folderId 1004 :title "Survey AB1" :type "survey"}])

(def folders-and-surveys-with-removed-empty-folders
  [{:id 1000 :folderId 0 :title "Folder A" :type "folder"}
   {:id 1002 :folderId 0 :title "Survey C" :type "survey"}
   {:id 1004 :folderId 1000 :title "Folder AB" :type "folder"}
   {:id 1006 :folderId 1000 :title "Survey A1" :type "survey"}
   {:id 1008 :folderId 1004 :title "Survey AB1" :type "survey"}])

(deftest remove-empty-folders-tests
  (testing "remove empty folders"
    (is (= (flow-impl/remove-empty-folders folders-and-surveys)
           folders-and-surveys-with-removed-empty-folders))))

(def flow-endpoint
  (flow/endpoint {:config {:flow-report-database-url "jdbc:postgresql://localhost/%s"}}))

(use-fixtures :each
  (fn [f]
    (with-redefs [flow-impl/descendant-folders-and-surveys-by-folder-id
                  (constantly folders-and-surveys)]
      (f))))

(defn flow-instances-request [& claims]
  (-> (assoc (mock/request :get "/api/flow/instances")
             :jwt-claims {"realm_access" {"roles" claims}})
      flow-endpoint
      :body
      :instances))

(defn flow-folders-and-surveys-request [instance claims]
  (-> (assoc (mock/request :get (str "/api/flow/folders-and-surveys/" instance))
             :jwt-claims {"realm_access" {"roles" claims}})
      flow-endpoint
      :body))

(deftest flow-endpoint-tests
  (testing "/api/flow/instances"
    (is (= (flow-instances-request)
           #{}))
    (is (= (flow-instances-request "akvo:flow:akvoflow-1:0")
           #{"akvoflow-1"}))
    (is (= (flow-instances-request "akvo:lumen:tenant-1"
                                   "akvo:flow:akvoflow-1:1000")
           #{"akvoflow-1"}))
    (is (= (flow-instances-request "akvo:lumen:tenant-1"
                                   "akvo:flow:akvoflow-1:1000"
                                   "akvo:flow:akvoflow-2:2000")
           #{"akvoflow-1" "akvoflow-2"}))
    (is (= (flow-instances-request "akvo:lumen:tenant-1"
                                   "akvo:flow:akvoflow-1:1000"
                                   "akvo:flow:akvoflow-2:2000"
                                   "akvo:flow:akvoflow-1:3000")
           #{"akvoflow-1" "akvoflow-2"})))
  (testing "/flow/folders-and-surveys"
    (is (= (flow-folders-and-surveys-request "akvoflow-1" [])
           []))
    (is (= (flow-folders-and-surveys-request "akvoflow-1" ["akvo:flow:akvoflow-2:0"])
           []))
    (is (= (flow-folders-and-surveys-request "akvoflow-1" ["akvo:flow:akvoflow-1:0"])
           folders-and-surveys-with-removed-empty-folders))))
