(defproject org.akvo/lumen "0.14-SNAPSHOT"
  :description "Akvo Lumen backend"
  :url "https://github.com/akvo/akvo-lumen"
  :license {:name "GNU Affero General Public License 3.0"
            :url  "https://www.gnu.org/licenses/agpl-3.0.html"}
  :min-lein-version "2.0.0"
  :dependencies [[ch.qos.logback/logback-classic "1.2.3"]
                 [org.clojure/tools.logging "0.4.0"]
                 [org.slf4j/log4j-over-slf4j "1.7.25"]
                 [org.slf4j/jcl-over-slf4j "1.7.25"]
                 [org.slf4j/jul-to-slf4j "1.7.25"]
                 [cheshire "5.8.0"]
                 [clj-http "3.7.0"]
                 [clj-time "0.14.0"]
                 [com.layerware/hugsql "0.4.7"]
                 [com.stuartsierra/component "0.3.2"]
                 [commons-io/commons-io "2.5"]
                 [compojure "1.6.0" :exclusions [medley]]
                 [duct "0.8.2"]
                 [duct/hikaricp-component "0.1.1" :exclusions [org.slf4j/slf4j-nop]]
                 [environ "1.1.0"]
                 [funcool/cuerdas "2.0.3"]
                 [honeysql "0.9.1"]
                 [meta-merge "1.0.0"]
                 [org.akvo/commons "0.4.5" :exclusions [org.postgresql/postgresql org.clojure/java.jdbc]]
                 [org.akvo/resumed "0.1.0-SNAPSHOT"]
                 [org.apache.tika/tika-core "1.16"]
                 [org.apache.tika/tika-parsers "1.16" :exclusions [org.slf4j/slf4j-api]]
                 [org.clojure/clojure "1.9.0-beta1"]
                 [org.clojure/data.csv "0.1.4"]
                 [org.clojure/core.match "0.3.0-alpha5"]
                 [org.clojure/java.jdbc "0.7.3"]
                 [org.immutant/web "2.1.9" :exclusions [ch.qos.logback/logback-classic]]
                 [org.postgresql/postgresql "42.1.4"]
                 [ragtime/ragtime.jdbc "0.6.4"]
                 [raven-clj "1.5.0"]
                 [ring "1.6.2"]
                 [ring/ring-defaults "0.3.1"]
                 [ring/ring-json "0.4.0"]
                 [selmer "1.11.1"]
                 [net.postgis/postgis-jdbc "2.2.1" :exclusions [org.postgresql/postgresql]]]
  :uberjar-name "akvo-lumen.jar"
  :repl-options {:timeout 120000}
  ;; :pedantic? :abort
  :plugins [[lein-ancient "0.6.10"]
            [lein-codox "0.9.6"]
            [lein-environ "1.0.3"]]
  :codox {:doc-paths   ["resources/akvo/lumen/doc"]
          :output-path "../docs"}
  :main ^:skip-aot akvo.lumen.main
  :target-path "target/%s/"
  :aliases {"setup"   ["run" "-m" "duct.util.repl/setup"]
            "migrate" ["run" "-m" "dev/migrate"]
            "seed"    ["run" "-m" "dev/seed"]}
  :test-selectors {:default (and (constantly true)
                                 (complement :functional))
                   :all     (constantly true)}
  :profiles
  {:dev           [:project/dev :profiles/dev]
   :test          [:project/test :profiles/test]
   :uberjar       {:aot :all}
   :profiles/dev  {}
   :profiles/test {}
   :project/dev   {:dependencies   [[duct/generate "0.8.2"]
                                    [reloaded.repl "0.2.3"]
                                    [org.clojure/tools.namespace "0.2.11"]
                                    [org.clojure/tools.nrepl "0.2.13"]
                                    [eftest "0.3.1"]
                                    [com.gearswithingears/shrubbery "0.4.1"]
                                    [kerodon "0.8.0"]]
                   :source-paths   ["dev/src"]
                   :resource-paths ["dev/resources" "test/resources"]
                   :repl-options   {:init-ns dev
                                    :init (do
                                            (println "Starting BackEnd ...")
                                            (go)
                                            (migrate)
                                            (seed)
                                            (migrate))
                                    :host "0.0.0.0"
                                    :port 47480}
                   :env            {:port "3000"}}
   :project/test  {:resource-paths ["test/resources"]
                   :env
                   {:db {:uri "jdbc:postgresql://postgres/lumen?user=lumen&password=password"}}}})
