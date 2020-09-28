(require 'package)

(add-to-list 'package-archives
	     '("melpa-stable" . "https://stable.melpa.org/packages/") t)

(setq gnutls-algorithm-priority "NORMAL:-VERS-TLS1.3")
(setq url-http-attempt-keepalives nil)

(package-initialize)

(package-refresh-contents)

(tool-bar-mode -1)

(setq inhibit-splash-screen t
      inhibit-startup-message t
      backup-inhibited t)

(setq auto-save-default nil)

(setq-default fill-column 100)

(menu-bar-mode -1)

(unless (package-installed-p 'clojure-mode)
  (package-install 'clojure-mode))

(unless (package-installed-p 'cider)
  (package-install 'cider))

(unless (package-installed-p 'paredit)
  (package-install 'paredit))

(unless (package-installed-p 'company)
  (package-install 'company))

(unless (package-installed-p 'flycheck)
  (package-install 'flycheck))

(unless (package-installed-p 'ag)
  (package-install 'ag))

;;(global-company-mode)
(global-flycheck-mode 1)
(show-paren-mode 1)
(setq show-paren-delay 0)

(add-hook 'before-save-hook #'delete-trailing-whitespace)

(load-theme 'tango-dark t)

;; CIDER
(add-hook 'clojure-mode-hook 'paredit-mode)
(setq cider-prompt-save-file-on-load 'always-save)
(add-hook 'cider-repl-mode-hook #'company-mode)
(add-hook 'cider-mode-hook #'company-mode)
(add-hook 'cider-repl-mode-hook #'paredit-mode)
(add-hook 'cider-mode-hook #'eldoc-mode)
(setq cider-prompt-for-symbol nil)
(setq cider-save-file-on-load t)
(setq cider-repl-display-help-banner nil)

;; ido
(setq ido-enable-flex-matching t)
(setq ido-everywhere t)
(ido-mode 1)

;; org-mode
(org-babel-do-load-languages
 'org-babel-load-languages
 '((emacs-lisp . nil)
   (shell . t)
   (sql . t)))

(setq org-confirm-babel-evaluate nil)
