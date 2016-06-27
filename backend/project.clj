(defproject org.akvo.lumen "0.1.0-SNAPSHOT"
  :description "Akvo Lumen backend"
  :url "https://github.com/akvo/akvo-lumen"
  :license {:name "GNU Affero General Public License 3.0"
            :url  "https://www.gnu.org/licenses/agpl-3.0.html"}
  :min-lein-version "2.0.0"
  :dependencies [[cheshire "5.6.2"]
                 [clj-http "3.1.0"]
                 [clj-time "0.12.0"]
                 [com.layerware/hugsql "0.4.7"]
                 [com.novemberain/pantomime "2.8.0"]
                 [com.stuartsierra/component "0.3.1"]
                 [compojure "1.5.1"]
                 [duct "0.5.10"]
                 [duct/hikaricp-component "0.1.0"]
                 [environ "1.0.3"]
                 [meta-merge "1.0.0"]
                 [org.akvo/commons "0.4.4-SNAPSHOT"]
                 [org.akvo/resumed "0.1.0-SNAPSHOT"]
                 [org.apache.tika/tika-core "1.13"]
                 [org.clojure/clojure "1.8.0"]
                 [org.clojure/core.match "0.3.0-alpha4"]
                 [org.clojure/data.csv "0.1.3"]
                 [org.clojure/java.jdbc "0.6.1"]
                 [org.immutant/scheduling "2.1.4" :exclusions [ch.qos.logback/logback-classic]]
                 [org.immutant/web "2.1.4"]
                 [org.postgresql/postgresql "9.4.1208"]
                 [org.slf4j/slf4j-nop "1.7.21"]
                 [pandect "0.6.0"]
                 [ragtime "0.6.0"]
                 [ring "1.5.0"]
                 [ring/ring-defaults "0.2.1"]
                 [ring/ring-json "0.4.0"]]
  :uberjar-name "akvo-lumen.jar"
  :repl-options {:timeout 120000}
  :plugins [[lein-codox "0.9.1"]
            [lein-environ "1.0.2"]
            [lein-gen "0.2.2"]]
  :codox {:doc-paths   ["resources/org/akvo/lumen/doc"]
          :output-path "doc"}
  :generators [[duct/generators "0.5.8"]]
  :duct {:ns-prefix org.akvo.lumen}
  :main ^:skip-aot org.akvo.lumen.main
  :target-path "target/%s/"
  :aliases {"gen"      ["generate"]
            "migrate"  ["run" "-m" "user/migrate"]
            "rollback" ["run" "-m" "user/rollback"]
            "seed"     ["run" "-m" "user/seed"]
            "setup"    ["do" ["generate" "locals"]]}
  :test-selectors {:default (and (constantly true)
                                 (complement :functional))
                   :all     (constantly true)}
  :profiles
  {:dev           [:project/dev  :profiles/dev]
   :test          [:project/test :profiles/test]
   :uberjar       {:aot :all}
   :profiles/dev  {}
   :profiles/test {}
   :project/dev   {:dependencies [[ring/ring-mock "0.3.0"]
                                  [ring/ring-devel "1.5.0"]
                                  [reloaded.repl "0.2.2"]
                                  [org.clojure/tools.namespace "0.2.11"]
                                  [org.clojure/tools.nrepl "0.2.12"]
                                  [eftest "0.1.1"]
                                  [kerodon "0.8.0"]
                                  [criterium "0.4.4"]]
                   :source-paths ["dev"]
                   :resource-paths ["test/resources"]
                   :repl-options   {:init-ns user}
                   :env            {:port 3000}}
   :project/test  {}})
