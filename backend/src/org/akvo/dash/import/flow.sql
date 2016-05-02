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

-- :name form-instances-by-form-id
-- :command :query
-- :result :many
-- :doc Get form instances by form id
  SELECT form_instance.id,
         data_point.identifier,
         data_point.latitude,
         data_point.longitude,
         form_instance.submitter,
         form_instance.submitted_at
    FROM data_point, form_instance
   WHERE form_instance.data_point_id=data_point.id AND
         form_instance.form_id=:form-id
ORDER BY form_instance.submitted_at;

-- :name responses-by-form-instance-id
-- :command :query
-- :result :many
-- :doc Get responses by form instance id. Only first iteration
SELECT question_id AS "question-id",
       value->'value' AS value,
       type AS "question-type"
  FROM response, question
 WHERE form_instance_id=:form-instance-id
   AND iteration=0
   AND question.id=response.question_id

-- :name descendant-folders-and-surveys-by-folder-id
-- :command :query
-- :result :many
-- :doc Recursively get all descendant folders and
-- surveys with folder-id as root. For now we only support
-- non-monitoring surveys which is why we additionally filter by
-- form_count=1
WITH RECURSIVE descendants(parent_id, id) as (
  (
    SELECT parent_id, id, 'folder' as type, display_text, NULL AS form_count
      FROM folder
     WHERE parent_id IN (:v*:folder-ids)
     UNION
    SELECT survey.folder_id, survey.id, 'survey', survey.display_text, count(form)
      FROM survey, form
     WHERE folder_id IN (:v*:folder-ids)
       AND survey.id=form.survey_id
  GROUP BY survey.id
  )
  UNION
  (
  SELECT folders_and_surveys.parent_id,
         folders_and_surveys.id,
         folders_and_surveys.type,
         folders_and_surveys.display_text,
         folders_and_surveys.form_count
    FROM (
           SELECT parent_id, id, 'folder' AS type, display_text, NULL AS form_count
             FROM folder
            UNION
           SELECT survey.folder_id, survey.id, 'survey', survey.display_text, count(form)
             FROM survey, form
            WHERE survey.id=form.survey_id
         GROUP BY survey.id
         )
         folders_and_surveys,
         descendants
   WHERE descendants.id=folders_and_surveys.parent_id
  )
)
SELECT id,
       parent_id AS "folderId",
       type,
       display_text AS title
  FROM descendants
 WHERE form_count=1
    OR type='folder';
