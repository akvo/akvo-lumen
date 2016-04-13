(defproject org.akvo.dash "0.1.0-SNAPSHOT"
  :description "Akvo Dash backend."
  :url "https://github.com/akvo/akvo-dash"
  :license {:name "GNU Affero General Public License 3.0"
            :url  "https://www.gnu.org/licenses/agpl-3.0.html"}
  :min-lein-version "2.0.0"
  :dependencies [[cheshire "5.5.0"]
                 [clj-http "2.1.0"]
                 [clj-time "0.11.0"]
                 [com.layerware/hugsql "0.4.4"]
                 [com.novemberain/pantomime "2.8.0"]
                 [com.stuartsierra/component "0.3.1"]
                 [compojure "1.4.0"]
                 [duct "0.5.8"]
                 [duct/hikaricp-component "0.1.0"]
                 [duct/ragtime-component "0.1.3"]
                 [environ "1.0.2"]
                 [meta-merge "0.1.1"]
                 [org.clojure/clojure "1.8.0"]
                 [org.clojure/data.csv "0.1.3"]
                 [org.clojure/java.jdbc "0.4.2"]
                 [org.immutant/scheduling "2.1.2"]
                 [org.immutant/web "2.1.2"]
                 [org.postgresql/postgresql "9.4.1208"]
                 [org.slf4j/slf4j-nop "1.7.18"]
                 [pandect "0.5.4"]
                 [ring "1.4.0"]
                 [ring-jetty-component "0.3.0"]
                 [ring/ring-defaults "0.1.5"]
                 [ring/ring-devel "1.4.0"]
                 [ring/ring-json "0.4.0"]
                 [ring/ring-mock "0.3.0"]
                 [traversy "0.4.0"]
                 [org.akvo/resumed "0.1.0-SNAPSHOT"]
                 [org.akvo/commons "0.4.4-SNAPSHOT"]]
  :repl-options {:timeout 120000}
  :plugins [[lein-codox "0.9.1"]
            [lein-environ "1.0.2"]
            [lein-gen "0.2.2"]]
  :codox {:doc-paths ["resources/org/akvo/dash/doc"]
          :output-path "doc"}
  :generators [[duct/generators "0.5.8"]]
  :duct {:ns-prefix org.akvo.dash}
  :main ^:skip-aot org.akvo.dash.main
  :target-path "target/%s/"
  :aliases {"gen"   ["generate"]
            "setup" ["do" ["generate" "locals"]]}
  :test-selectors {:default (and (constantly true)
                                 (complement :functional))
                   :all (constantly true)}
  :profiles
  {:dev  [:project/dev  :profiles/dev]
   :test [:project/test :profiles/test]
   :uberjar {:aot :all}
   :profiles/dev  {}
   :profiles/test {}
   :project/dev   {:dependencies [[reloaded.repl "0.2.1"]
                                  [org.clojure/tools.namespace "0.2.11"]
                                  [org.clojure/tools.nrepl "0.2.12"]
                                  [eftest "0.1.0"]
                                  [kerodon "0.7.0"]]
                   :source-paths ["dev"]
                   :repl-options {:init-ns user}
                   :env {:port 3000}}
   :project/test  {}})
