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

(defn response-index
  "Index a sequence of responses in form-instance-id question-id iteration order."
  [responses]
  (reduce (fn [index {:keys [form_instance_id question_id iteration] :as response}]
            (assoc-in index [form_instance_id question_id iteration] response))
          {}
          responses))

(defn form-instances-index
  "Index a sequence of form-instances in data_point_id and form_id order"
  [form-instances responses]
  (reduce (fn [index {:keys [id form_id data_point_id] :as form-instance}]
            (update-in index
                       [data_point_id form_id]
                       (fnil conj [])
                       (assoc form-instance
                              :responses
                              (get responses id))))
          {}
          form-instances))

(defn survey-data-points [conn {:keys [survey-id form-id] :as opts}]
  (let [data-points (data-points-by-survey-id conn {:survey-id survey-id})
        form-instances (if form-id
                         (form-instances-by-form-id conn {:form-id form-id})
                         (form-instances-by-survey-id conn {:survey-id survey-id}))
        responses (if form-id
                    (responses-by-form-id conn {:form-id form-id})
                    (responses-by-survey-id conn {:survey-id survey-id}))
        responses (response-index responses)
        form-instances (form-instances-index form-instances responses)]
    (for [{:keys [id] :as data-point} data-points]
      (assoc data-point :form-instances (get form-instances id)))))

;; =======

(defn dataset-columns [form]
  (let [common [{:title "Identifier" :type "string"}
                {:title "Latitude" :type "number"}
                {:title "Longitude" :type "number"}
                {:title "Submitter" :type "string"}
                {:title "Submitted at" :type "date"}]
        questions (mapcat (comp #(map (fn [question]
                                        {:title (:display_text question)
                                         :type "string"})
                                      %)
                                :questions)
                          (:question-groups form))]
    (map-indexed (fn [idx col]
                   (assoc col :column-name (str "c" (inc idx))))
                 (concat common questions))))

(defn form-instance-row [format-responses data-point form-instance]
  (reduce into
          ((juxt :identifier :latitude :longitude) data-point)
          [((juxt :submitter :submitted_at) form-instance)
           (format-responses form-instance)]))

(defn dataset-data [data-points form-id format-responses]
  (reduce into
          []
          (for [data-point data-points
                :let [form-instances (get-in data-point [:form-instances form-id])]]
            (map #(form-instance-row format-responses data-point %)
                 form-instances))))

(defn format-responses-fn [form]
  (let [question-ids (mapcat (comp #(map :id %) :questions)
                             (:question-groups form))]
    (fn [form-instance]
      (mapv (fn [question-id]
              (json/generate-string (get-in form-instance
                                            [:responses question-id 0 :value "value"])))
            question-ids))))

(defn create-data-table [table-name column-names]
  (format "create table %s (%s);"
          table-name
          (str/join ", " (map #(str % " jsonb") column-names))))

(defn insert-dataset-data! [conn dataset-data table-name column-names]
  (apply jdbc/insert!
         conn
         table-name
         (map (fn [data-row]
                (into {} (map vector
                              column-names
                              (map pg/val->jsonb-pgobj data-row) )))
              dataset-data)))

(defn create-dataset [tenant-conn table-name report-conn survey-id form-id]
  (let [survey (survey-definition report-conn survey-id)
        form (get-in survey [:forms form-id])
        format-responses (format-responses-fn form)
        data-points (survey-data-points report-conn {:survey-id survey-id :form-id form-id})
        dataset-columns (dataset-columns form)
        dataset-data (dataset-data data-points (:id form) format-responses)]
    (jdbc/execute! tenant-conn [(create-data-table table-name (map :column-name dataset-columns))])
    (insert-dataset-data! tenant-conn dataset-data table-name (map :column-name dataset-columns))
    (mapv (juxt :title :column-name :type) dataset-columns)))

(defmethod make-dataset-data-table "AKVO_FLOW"
  [tenant-conn {:keys [flow-report-database-url]} table-name {:strs [orgId surveyId formId]}]
  (try
    {:success? true
     :columns (create-dataset tenant-conn
                              table-name
                              (format flow-report-database-url orgId)
                              surveyId
                              formId)}
    (catch Exception e
      (.printStackTrace e)
      {:success? false
       :reason (str "Unexpected error " (.getMessage e))})))
