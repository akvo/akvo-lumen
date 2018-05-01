(ns akvo.lumen.utils.logging-config
  (:require [clojure.tools.logging :as logging]))

(def log-levels {:off   0
                 :trace 1 
                 :debug 2
                 :info  3
                 :warn  4
                 :error 5
                 :fatal 6})

(defmacro with-logs-over
  "`level`: dont see this level nor any behid it
   `body`: body to evaluate

   example (with-logs-over :warn (calling-your-fun ...) (....)  
   You'll see only error and fatal logging calls"
  [level & body]
  `(let [orig# clojure.tools.logging/log*]
     (with-redefs [~'clojure.tools.logging/log*
                   (fn [~'logger level# ~'throwable ~'message]
                     (when-not (>= (~level log-levels) (level# log-levels))
                       (orig# ~'logger level# ~'throwable ~'message)))]
             ~@body)))

(defmacro with-no-logs [& body]
  `(with-logs-over :fatal ~@body))
