(ns akvo.lumen.lib.auth-test
  (:require [akvo.lumen.lib.auth :as auth]
            [akvo.lumen.specs.visualisation.maps :as visualisation.maps.s]
            [akvo.lumen.specs.visualisation :as visualisation.s]
            [clojure.set :as set]
            [clojure.spec.alpha :as s]
            [clojure.test :refer :all]))

(declare author)

(deftest ids-test
  (testing "visualisation pie payload"
    (let [ds-id "5ca70f7a-3c66-45ac-a546-820dd55e3916"
          v-id "5caaf957-e5eb-47be-a807-65697536fa7e"
          data {:name "jolin asdasd",
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
                :id v-id}]
      (is (= (auth/ids ::visualisation.s/visualisation data)
             {:dashboard-ids #{}, :collection-ids #{}, :dataset-ids #{ds-id}, :visualisation-ids #{v-id}}))
      (is (s/valid? ::visualisation.s/visualisation data)) (s/explain-data ::visualisation.s/visualisation data)
      (testing "l.auth/ids keep working when not s/valid?"
        (let [ds-id "1"
              data (assoc data :datasetId ds-id)]
          (is (not (s/valid? ::visualisation.s/visualisation data)))
          (is (= (auth/ids ::visualisation.s/visualisation data)
                 {:dashboard-ids #{}, :collection-ids #{}, :dataset-ids #{ds-id}, :visualisation-ids #{v-id}}))))))
  (testing "visualisation map types, could have datasetId(s) in layer collection"
    (let [ds-id  "5cbd79a7-ba3b-4443-8433-2d14639dd269"
         ds2-id "5ca70f7a-3c66-45ac-a546-820dd55e3916"
         vis-id "5cbda7e2-ff60-4ab8-87b3-34d60b6f4687"
         data {:name "vis map name",
               :visualisationType "map",
               :type "visualisation",
               :created 1555933154021,
               :modified 1555933154021,
               :author author,
               :datasetId nil,
               :spec
               {:version 1,
                :baseLayer "street",
                :layers [{:aggregationMethod "avg",
                          :popup [],
                          :filters [],
                          :layerType "geo-location",
                          :legend {:title "latitude", :visible true},
                          :rasterId nil,
                          :pointSize 3,
                          :pointColorMapping [],
                          :longitude nil,
                          :datasetId ds2-id,
                          :title "Untitled layer 1",
                          :geom "d1",
                          :pointColorColumn "c2",
                          :latitude nil,
                          :visible true}
                         {:aggregationMethod "avg",
                          :popup [],
                          :filters [],
                          :layerType "geo-location",
                          :legend {:title "latitude", :visible true},
                          :rasterId nil,
                          :pointSize 3,
                          :pointColorMapping [],
                          :longitude nil,
                          :datasetId ds-id,
                          :title "Untitled layer 1",
                          :geom "d1",
                          :pointColorColumn "c2",
                          :latitude nil,
                          :visible true}]},
               :status "OK",
               :id vis-id}]
     (is (= (auth/ids ::visualisation.s/visualisation data)
            {:collection-ids #{}, :dashboard-ids #{}, :dataset-ids #{ds-id ds2-id}, :visualisation-ids #{vis-id}}))
     (is (s/valid? ::visualisation.s/visualisation data))))
  (testing "testing vis map layers"
    (let [ds-id "5cac541e-ba6c-4c78-969a-c55d624fc5ba"
         data [{:aggregationMethod "avg",
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
                :visible true}]]
     (is (= (auth/ids ::visualisation.maps.s/layers data)
            {:dataset-ids #{ds-id},
             :dashboard-ids #{}
             :visualisation-ids #{},
             :collection-ids #{}}))
     (is (s/valid? ::visualisation.maps.s/layers data)))))

(def author {:given_name "Jerome",
             :email "jerome@t1.akvolumen.org",
             :aud ["akvo-lumen"],
             "https://akvo.org/user_metadata" {"new_authz_flag" "true"}
             :allowed-origins
             ["http://t1.lumen.local:8081"
              "http://t1.lumen.local:3030"
              "http://t2.lumen.local:3030"
              "http://t2.lumen.local"
              "http://t1.lumen.local"],
             :session_state "1d91e2e6-3266-49a7-9d4e-d9dd90a1b8e4",
             :sub "343ef061-25ca-4808-841b-7218f8a26b7f",
             :iss "http://auth.lumen.local:8080/auth/realms/akvo",
             :name "Jerome Eginla",
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
