(defproject akvo-dash "0.1.0-SNAPSHOT"
  :description "Akvo DASH"
  :url "https://github.com/akvo/akvo-dash"
  :license {:name "GNU Affero Public License 3.0"
            :url "https://www.gnu.org/licenses/agpl-3.0.html"}
  :dependencies [[org.clojure/clojure "1.7.0"]
                 [org.clojure/java.jdbc "0.3.6"]
                 [org.postgresql/postgresql "9.4-1204-jdbc41"]
                 [cheshire "5.5.0"]
                 [clojurewerkz/elastisch "2.1.0"]
                 [com.stuartsierra/component "0.3.0"]
                 [clj-statsd "0.3.11"]
                 [ring "1.4.0"]
                 [compojure "1.4.0"]
                 [clj-http "2.0.0"]
                 [org.clojure/data.csv "0.1.3"]])
