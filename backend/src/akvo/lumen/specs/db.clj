(ns akvo.lumen.specs.db
  (:require [clojure.spec.alpha :as s]
	    [akvo.lumen.specs.core :as lumen.s])
  (:import com.zaxxer.hikari.HikariDataSource))

(s/def ::uri (s/with-gen string?
	       #(s/gen #{"jdbc:postgresql://postgres/lumen?user=lumen&password=password&ssl=true"})))

(s/def ::datasource (s/with-gen (partial instance? HikariDataSource)
		      #(s/gen #{(HikariDataSource.)})))

(s/def ::spec (s/keys :req-un [::datasource]))

(s/def ::db (s/keys :req-un [::datasource]
		    :opt-un [::uri]))

(s/def ::tenant-connection ::spec)


(s/def ::sort #{"asc" "dsc"})
