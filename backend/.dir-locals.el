((nil . ((cider-ns-refresh-before-fn . "integrant.repl/suspend")
         (cider-ns-refresh-after-fn  . "integrant.repl/resume")
         (eval . (customize-set-variable 'cider-path-translations
                                         (let ((m2 (concat (getenv "HOME") "/.m2")))
                                           (list
                                             (cons "/app" (clojure-project-dir))
                                             (cons "/home/akvo/.m2" m2)
                                             (cons "/root/.m2" m2))))))))
