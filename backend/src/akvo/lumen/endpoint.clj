(ns akvo.lumen.endpoint
  (:require [akvo.lumen.http :as http]
            [akvo.lumen.lib :as lib]
            [compojure.response]))

(defmulti variant->response (fn [variant request]
                              (first variant)))

(extend-protocol compojure.response/Renderable
  clojure.lang.IPersistentVector
  (render [variant request]
    (variant->response variant request)))

(defmethod variant->response ::lib/ok
  [[_ entity] _]
  (http/ok entity))

(defmethod variant->response ::lib/created
  [[_ entity] _]
  (http/created entity))

(defmethod variant->response ::lib/no-content
  [_ _]
  (http/no-content))

(defmethod variant->response ::lib/bad-request
  [[_ description] _]
  (http/bad-request description))

(defmethod variant->response ::lib/not-authenticated
  [[_ description] _]
  (http/not-authenticated description))

(defmethod variant->response ::lib/not-authorized
  [[_ description] _]
  (http/not-authorized description))

(defmethod variant->response ::lib/not-found
  [[_ entity] _]
  (http/not-found entity))

(defmethod variant->response ::lib/conflict
  [[_ description] _]
  (http/conflict description))

(defmethod variant->response ::lib/gone
  [[_ description] _]
  (http/gone description))

(defmethod variant->response ::lib/internal-server-error
  [[_ error-message] _]
  (http/internal-server-error error-message))

(defmethod variant->response ::lib/not-implemented
  [[_ description] _]
  (http/not-implemented description))

(defmethod variant->response ::lib/unprocessable-entity
  [[_ entity] _]
  (http/unprocessable-entity entity))

(defmethod variant->response ::lib/redirect
  [[_ location] _]
  (http/redirect location))
