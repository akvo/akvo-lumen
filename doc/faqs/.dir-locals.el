((nil . ((eval . (defadvice org-export-output-file-name (before org-add-export-dir activate)
		   "Modifies org-export to place exported files in a different directory"
		   (when (not pub-dir)
		     (setq pub-dir (concat  "../../faqs" "../../docs/faqs" ))
		     (when (not (file-directory-p pub-dir))
		       (make-directory pub-dir))))))))
