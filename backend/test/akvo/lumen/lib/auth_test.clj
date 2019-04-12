(ns akvo.lumen.lib.auth-test
  (:require [akvo.lumen.lib.auth :as auth]
            [akvo.lumen.specs.visualisation.maps]
            [akvo.lumen.specs.visualisation]
            [clojure.set :as set]
            [clojure.test :refer :all]))

(declare author)

(deftest ids-test
  (let [ds-id "5ca70f7a-3c66-45ac-a546-820dd55e3916"
        v-id "5caaf957-e5eb-47be-a807-65697536fa7e"
        spec-valid? true]
    (is (= (auth/ids
            :akvo.lumen.specs.visualisation/visualisation
            {:name "jolin asdasd",
             :visualisationType "pie",
             :type "visualisation",
             :created 1554708823102,
             :modified 1554796491579,
             :datasetId ds-id,
             :author author, 
             :spec
             {:sort nil,
              :filters [],
              :version 1,
              :showLegend nil,
              :legendTitle "Temperature",
              :bucketColumn "c4"},
             :status "OK",
             :id v-id})
           {:dashboard-ids #{}, :collection-ids #{}, :dataset-ids #{ds-id}, :visualisation-ids #{v-id}, :spec-valid? spec-valid?})))
  (let [ds-id "1"
        spec-valid? false]
    (is (= (auth/ids
            :akvo.lumen.specs.visualisation.maps/layers
            [{:aggregationMethod "avg", :popup [], :filters [], :layerType "geo-location", :legend {:title "latitude", :visible true}, :rasterId nil, :pointSize 3, :pointColorMapping [], :longitude nil, :datasetId ds-id, :title "Untitled layer 1", :geom "d1", :pointColorColumn "c2", :latitude nil, :visible true}])
           {:collection-ids #{}, :dashboard-ids #{}, :dataset-ids #{ds-id}, :visualisation-ids #{}, :spec-valid? spec-valid?})))
  (let [ds-id "5cac541e-ba6c-4c78-969a-c55d624fc5ba"
        spec-valid? true]
    (is (= (auth/ids
            :akvo.lumen.specs.visualisation.maps/layers 
            [{:aggregationMethod "avg",
              :popup [],
              :filters [],
              :layerType "geo-location",
              :legend {:title "latitude", :visible true},
              :rasterId nil,
              :pointSize 3,
              :pointColorMapping [],
              :longitude nil,
              :datasetId ds-id,
              :title "go1",
              :geom "d1",
              :pointColorColumn "c2",
              :latitude nil,
              :visible true}
             {:aggregationMethod "avg",
              :popup [],
              :filters [],
              :layerType "raster",
              :legend {:title nil, :visible true},
              :rasterId "5cac54fa-d93a-45d3-be6c-356f85559a9d",
              :pointSize 3,
              :pointColorMapping [],
              :longitude nil,
              :datasetId nil,
              :title "Untitled layer 2",
              :geom nil,
              :pointColorColumn nil,
              :latitude nil,
              :visible true}
             {:aggregationMethod "avg",
              :popup [{:column "c2"}],
              :filters [],
              :layerType "geo-location",
              :legend {:title "latitude", :visible true},
              :rasterId nil,
              :pointSize 3,
              :pointColorMapping [],
              :longitude nil,
              :datasetId ds-id,
              :title "Untitled layer 3",
              :geom "d1",
              :pointColorColumn "c2",
              :latitude nil,
              :visible true}])
           {:dataset-ids #{ds-id},
            :dashboard-ids #{}
            :visualisation-ids #{},
            :collection-ids #{},
            :spec-valid? spec-valid?}))))


(def author {:given_name "Jerome$auth$",
             :email "jerome@t1.lumen.localhost",
             :aud ["akvo-lumen"],
             :allowed-origins
             ["http://t1.lumen.local:8081"
              "http://t1.lumen.local:3030"
              "http://t2.lumen.local:3030"
              "http://t2.lumen.local"
              "http://t1.lumen.local"],
             :session_state "1d91e2e6-3266-49a7-9d4e-d9dd90a1b8e4",
             :sub "343ef061-25ca-4808-841b-7218f8a26b7f",
             :iss "http://auth.lumen.local:8080/auth/realms/akvo",
             :name "Jerome$auth$ Eginla",
             :exp "2019-04-08T07:38:37Z",
             :azp "akvo-lumen",
             :realm_access
             {:roles
              ["akvo:lumen:t1" "akvo:lumen:t1:admin" "uma_authorization"]},
             :family_name "Eginla",
             :auth_time 1554707946,
             :jti "cee78fd0-177b-4ad3-96e6-2530a8682d0c",
             :nbf "1970-01-01T00:00:00Z",
             :resource_access
             {:account {:roles ["manage-account" "view-profile"]}},
             :acr "0",
             :nonce "82752bdc-8e7d-453a-8822-99ce72c23893",
             :typ "Bearer",
             :preferred_username "jerome",
             :iat "2019-04-08T07:33:37Z"})
