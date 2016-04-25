-- :name survey-by-id
-- :command :query
-- :result :one
-- :doc Get survey by id
SELECT *
  FROM survey
 WHERE id=:id

-- :name forms-by-survey-id
-- :command :query
-- :result :many
-- :doc Get forms by survey id
SELECT *
  FROM form
 WHERE survey_id=:survey-id

-- :name question-groups-by-survey-id
-- :command :query
-- :result :many
-- :doc Get question groups by survey id
SELECT question_group.*
  FROM question_group, form
 WHERE question_group.form_id = form.id
   AND form.survey_id=:survey-id

-- :name questions-by-survey-id
-- :command :query
-- :result :many
-- :doc Get questions by survey id
SELECT question.*
  FROM question, question_group, form
 WHERE question_group.form_id = form.id
   AND question.question_group_id = question_group.id
   AND form.survey_id=:survey-id

-- :name data-points-by-survey-id
-- :command :query
-- :result :many
-- :doc Get data points by survey id
SELECT *
  FROM data_point
 WHERE survey_id=:survey-id

-- :name form-instances-by-survey-id
-- :command :query
-- :result :many
-- :doc Get form instances by survey id
SELECT form_instance.*
  FROM form_instance, form
 WHERE form_instance.form_id=form.id
   AND form.survey_id=:survey-id

-- :name form-instances-by-form-id
-- :command :query
-- :result :many
-- :doc Get form instances by form id
SELECT form_instance.*
  FROM form_instance
 WHERE form_instance.form_id=:form-id

-- :name responses-by-form-id
-- :command :query
-- :result :many
-- :doc Get responses by form id
SELECT response.*
  FROM response, form_instance
 WHERE response.form_instance_id=form_instance.id
   AND form_instance.form_id=:form-id

-- :name responses-by-survey-id
-- :command :query
-- :result :many
-- :doc Get responses by survey id
SELECT response.*
  FROM response, form_instance, form
 WHERE response.form_instance_id=form_instance.id
   AND form_instance.form_id=form.id
   AND form.survey_id=:survey-id
