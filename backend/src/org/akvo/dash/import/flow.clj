(ns org.akvo.dash.import.flow
  (:require [clojure.string :as str]
            [clojure.java.jdbc :as jdbc]
            [akvo.commons.psql-util :as pg]
            [cheshire.core :as json])
  (:import [org.postgresql.util PGobject]))

(set! *warn-on-reflection* true)
(set! *print-length* 20)

(defn survey-definition [conn survey-id]
  (let [survey (first (jdbc/query conn ["SELECT * FROM survey where id=?" survey-id]))
        forms (jdbc/query conn ["select * from form where survey_id=?" survey-id])
        question-groups (jdbc/query conn
                                    [(print-str "select question_group.*"
                                                "from question_group, form"
                                                "where question_group.form_id = form.id and"
                                                "form.survey_id=?")
                                     survey-id])
        questions (jdbc/query conn
                              [(print-str "select question.*"
                                          "from question, question_group, form"
                                          "where question_group.form_id = form.id and"
                                          "question.question_group_id = question_group.id and"
                                          "form.survey_id=?")
                               survey-id])
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


(defn form-instances-sql
  [{:keys [form-id]}]
  (if form-id
    (print-str "select form_instance.* from form_instance"
               "where form_instance.form_id=?")
    (print-str "select form_instance.* from form_instance, form"
               "where form_instance.form_id=form.id and"
               "form.survey_id=?")))

(defn responses-sql [{:keys [form-id]}]
  (if form-id
    (print-str "select response.* from response, form_instance"
               "where response.form_instance_id=form_instance.id and"
               "form_instance.form_id=?")
    (print-str "select response.* from response, form_instance, form"
               "where response.form_instance_id=form_instance.id and"
               "form_instance.form_id=form.id and"
               "form.survey_id=?")))

(defn survey-data-points [conn {:keys [survey-id form-id] :as opts}]
  (let [data-points (jdbc/query conn ["SELECT * FROM data_point where survey_id=?" survey-id])
        form-instances (jdbc/query conn
                                   [(form-instances-sql opts)
                                    (or form-id survey-id)])
        responses (jdbc/query conn
                              [(responses-sql opts)
                               (or form-id survey-id)])
        responses (response-index responses)
        form-instances (form-instances-index form-instances responses)]
    (for [{:keys [id] :as data-point} data-points]
      (assoc data-point :form-instances (get form-instances id)))))

;; =======

(defn dataset-columns [form]
  (concat [{:name "Identifier" :type "string"}
           {:name "Latitude" :type "number"}
           {:name "Longitude" :type "number"}
           {:name "Submitter" :type "string"}
           {:name "Submitted at" :type "date"}]
          (mapcat (comp #(map (fn [question]
                                {:name (:display_text question)
                                 :type "string"})
                              %)
                        :questions)
                  (:question-groups form))))

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
                 form-instances))) )

(defn format-responses-fn [form]
  (let [question-ids (mapcat (comp #(map :id %) :questions)
                             (:question-groups form))]
    (fn [form-instance]
      (mapv (fn [question-id]
              (json/generate-string (get-in form-instance
                                            [:responses question-id 0 :value "value"])))
            question-ids))))

(defn uuid []
  (str (java.util.UUID/randomUUID)))

(defn create-data-table [table-name column-names]
  (format "create table %s (%s);"
          table-name
          (str/join ", " (map #(str % " jsonb") column-names))))

(defn insert-dataset-columns! [conn dataset-id dataset-columns column-names]
  (apply jdbc/insert!
         conn
         :dataset_column
         (map-indexed
          (fn [idx column]
            (assoc column :c_order idx))
          (map (fn [column-name column]
                 (merge column
                        {:c_name column-name
                         :dataset_id dataset-id}))
               column-names
               dataset-columns))))

(defn insert-dataset-version! [conn dataset-id table-name]
  (jdbc/insert! conn
                :dataset_version
                {:dataset_id dataset-id
                 :table_name table-name
                 :version 0}))

(defn insert-dataset-data! [conn dataset-data table-name column-names]
  (apply jdbc/insert!
         conn
         table-name
         (map (fn [data-row]
                (into {} (map vector
                              column-names
                              (map pg/val->jsonb-pgobj data-row) )))
              dataset-data)))


(defn create-dataset [org-id survey-id form-id]
  (let [conn (str "jdbc:postgresql://localhost/" org-id)
        survey (survey-definition conn survey-id)
        form (get-in survey [:forms form-id])
        format-responses (format-responses-fn form)
        data-points (survey-data-points conn {:survey-id survey-id :form-id form-id})
        dataset-columns (dataset-columns form)
        column-count (count dataset-columns)
        dataset-data (dataset-data data-points (:id form) format-responses)
        table-name (str "ds_" (str/replace (uuid) "-" "_"))
        dataset-id (:id (first (jdbc/insert! conn :dataset {:name (:display_text survey)})))
        column-names (map #(str "c" %) (range))]
    (insert-dataset-columns! conn dataset-id dataset-columns column-names)
    (insert-dataset-version! conn dataset-id table-name)
    (jdbc/execute! conn [(create-data-table table-name (take column-count column-names))])
    (insert-dataset-data! conn dataset-data table-name column-names)))
