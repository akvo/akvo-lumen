;; using docker-compose up, we loose the cider ability to navigate definitions with `C - .` due the source of current (docker) nrepl is under a different path `/app/src` instead of akvo-lumen local git repo
;; so the trick is to replace docker source paths by user-local-paths.
((nil . ((eval . (defun to-local-paths (info)
		   "adapt src and .m2 docker paths to local paths"
		   (let* ((file (nrepl-dict-get info "file"))
			  (res-0 (progn
				   (replace-regexp-in-string  "/app/" (clojure-project-dir) file))))
		     (replace-regexp-in-string  "/root/.m2/"
						(concat (getenv "HOME") "/.m2/")
						res-0))))
	 (eval . (defun cider--jump-to-loc-from-info (info &optional other-window)
		   ""
		   (let* ((line (nrepl-dict-get info "line"))
			  (file (to-local-paths info))
			  (name (nrepl-dict-get info "name"))
			  ;; the filename might actually be a REPL buffer name
			  (buffer (cider--find-buffer-for-file file)))
		     (if buffer
			 (cider-jump-to buffer (if line (cons line nil) name) other-window)
		       (error (concat "No source location..." file)))))))))
