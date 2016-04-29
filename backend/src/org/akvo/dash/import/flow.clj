(ns org.akvo.dash.import.flow
  (:require [clojure.string :as str]
            [clojure.java.jdbc :as jdbc]
            [akvo.commons.psql-util :as pg]
            [hugsql.core :as hugsql]
            [cheshire.core :as json]
            [org.akvo.dash.import.common :refer (make-dataset-data-table)])
  (:import [org.postgresql.util PGobject]))

(hugsql/def-db-fns "org/akvo/dash/import/flow.sql")

(defn survey-definition [conn survey-id]
  (let [survey (survey-by-id conn {:id survey-id})
        forms (forms-by-survey-id conn {:survey-id survey-id})
        question-groups (question-groups-by-survey-id conn {:survey-id survey-id})
        questions (questions-by-survey-id conn {:survey-id survey-id})
        questions (group-by :question_group_id questions)
        question-groups (for [{:keys [id] :as question-group} (sort-by :display_order question-groups)]
                          (assoc question-group
                                 :questions
                                 (vec (sort-by :display_order (get questions id)))))
        question-groups (group-by :form_id question-groups)
        forms (for [form forms]
                (assoc form :question-groups (get question-groups (:id form))))]
    (assoc survey :forms (into {} (map (juxt :id identity)) forms))))

(defn questions [form]
  (mapcat :questions (:question-groups form)))

(defn dataset-columns [form]
  (let [common [{:title "Identifier" :type "string"}
                {:title "Latitude" :type "number"}
                {:title "Longitude" :type "number"}
                {:title "Submitter" :type "string"}
                {:title "Submitted at" :type "date"}]
        qs (map (fn [q]
                  {:type "string"
                   :title (:display_text q)})
                (questions form))]
    (map-indexed (fn [idx col]
                   (assoc col :column-name (str "c" (inc idx))))
                 (concat common qs))))

(defmulti render-response :question-type)

(defmethod render-response "FREE_TEXT"
  [{:keys [value]}]
  (when (string? value)
    (str value)))

(defmethod render-response "NUMBER"
  [{:keys [value]}]
  (when (number? value)
    value))

(defmethod render-response "OPTION"
  [{:keys [value]}]
  (str/join "|" (map (fn [{:strs [text code]}]
                       (if code
                         (str/join ":" [code text])
                         text))
                     value)))

(defmethod render-response "GEO"
  [{:keys [value]}]
  (if (map? value)
    (condp = (get-in value ["geometry" "type"])
      "Point" (let [coords (get-in value ["geometry" "coordinates"])]
                (str/join "," coords)))
    ""))

(defmethod render-response :default
  [response]
  nil)

(defn question-responses
  "Returns responses indexed by question id. A respons map consists of
  a :value and a :question-type"
  [conn form-instance-id]
  (into {}
        (map (juxt :question-id identity)
             (responses-by-form-instance-id
              conn
              {:form-instance-id form-instance-id}))))

(defn form-instance-data-rows [conn form]
  (for [form-instance (form-instances-by-form-id conn {:form-id (:id form)})]
    (let [responses (question-responses conn (:id form-instance))]
      (map pg/val->jsonb-pgobj
           (concat ((juxt :identifier :latitude :longitude :submitter :submitted_at)
                    form-instance)
                   (for [question (questions form)]
                     (render-response (get responses (:id question)))))) )))

(defn form-data
  "Returns a sequence of maps of the form {\"c1\" jsonb-obj, ...}"
  [conn form columns]
  (let [data-rows (form-instance-data-rows conn form)]
    (map (fn [columns data-row]
           (into {} (map (fn [column-name response]
                           [column-name response])
                         (map :column-name columns)
                         data-row)))
         (repeat columns)
         data-rows)))

(defn create-data-table [table-name column-names]
  (format "create table %s (%s);"
          table-name
          (str/join ", " (map #(str % " jsonb") column-names))))

(defn create-dataset [tenant-conn table-name report-conn survey-id]
  (let [survey (survey-definition report-conn survey-id)
        ;; For now we can assume that we only import non-monitoring
        ;; surveys, so grap the first and only form
        form (-> survey :forms first val)
        columns (dataset-columns form)
        data-rows (form-data report-conn form columns)]
    (jdbc/execute! tenant-conn [(create-data-table table-name (map :column-name columns))])
    (doseq [data-row data-rows]
      (jdbc/insert! tenant-conn table-name data-row))
    (mapv (juxt :title :column-name :type) columns)))

(defmethod make-dataset-data-table "AKVO_FLOW"
  [tenant-conn {:keys [flow-report-database-url]} table-name {:strs [instance surveyId]}]
  (try
    (jdbc/with-db-connection [report-conn (format flow-report-database-url instance)]
      {:success? true
       :columns (create-dataset tenant-conn
                                table-name
                                report-conn
                                surveyId)})
    (catch Exception e
      (.printStackTrace e)
      {:success? false
       :reason (str "Unexpected error " (.getMessage e))})))
