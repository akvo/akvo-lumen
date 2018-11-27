(ns akvo.lumen.protocols)

(defprotocol IErrorTracker
  (track [this error]))
