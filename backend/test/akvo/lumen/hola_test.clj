(ns akvo.lumen.hola-test
  (:require
   [cheshire.core :as json]
   [akvo.lumen.caddisfly-test :refer (parse-test schemas)]
   [clojure.test :refer [deftest testing is]]))

(def caddisfly-data
  "{
    \"device\": {
        \"model\": \"ASUS_Z00LD\",
        \"product\": \"WW_Z00L\",
        \"manufacturer\": \"asus\",
        \"os\": \"Android - 6.0.1 (23)\",
        \"country\": \"ID\",
        \"language\": \"in\"
    },
    \"image\": \"27a1821b-7bfa-4254-81b2-10a5446fa5f9.png\",
    \"user\": {
        \"backDropDetection\": true,
        \"language\": \"in\"
    },
    \"name\": \"Soil - Available Nitrogen\",
    \"uuid\": \"53a1649a-be67-4a13-8cba-1b7db640037c\",
    \"testDate\": \"2017-02-14 14:27\",
    \"type\": \"caddisfly\",
    \"app\": {
        \"appVersion\": \"Version 1.0.0 Alpha 8.6 (Build 167)\",
        \"language\": \"en\"
    },
    \"result\": [
        {
            \"name\": \"Available Nitrogen\",
            \"unit\": \"kg/ha\",
            \"id\": 1,
            \"value\": \"582.4\"
        },
        {
            \"name\": \"Nitrate Nitrogen\",
            \"unit\": \"ppm\",
            \"id\": 2,
            \"value\": \"50.0\"
        },
        {
            \"name\": \"Nitrite Nitrogen\",
            \"unit\": \"ppm\",
            \"id\": 3,
            \"value\": \"2.0\"
        }
    ]
  }")
(get schemas "53a1649a-be67-4a13-8cba-1b7db640037c")
(def kk (json/parse-string caddisfly-data keyword))

(select-keys kk [:image :result])

{:app
 {:appVersion "Version 1.0.0 Alpha 8.6 (Build 167)", :language "en"},
 :device
 {:country "ID",
  :language "in",
  :manufacturer "asus",
  :model "ASUS_Z00LD",
  :os "Android - 6.0.1 (23)",
  :product "WW_Z00L"},
 :image "27a1821b-7bfa-4254-81b2-10a5446fa5f9.png",
 :name "Soil - Available Nitrogen",
 :result
 [{:id 1, :name "Available Nitrogen", :unit "kg/ha", :value "582.4"}
  {:id 2, :name "Nitrate Nitrogen", :unit "ppm", :value "50.0"}
  {:id 3, :name "Nitrite Nitrogen", :unit "ppm", :value "2.0"}],
 :testDate "2017-02-14 14:27",
 :type "caddisfly",
 :user {:backDropDetection true, :language "in"},
 :uuid "53a1649a-be67-4a13-8cba-1b7db640037c"}


{:brand "HACH 27454",
 :hasImage true,
 :name "Soil - Test Strips  - Hach - Nitrogen (mg/l)",
 :results
 [{:id 1, :name "Nitrogen", :unit "mg/l"}
  {:id 2, :name "Nitrate Nitrogen", :unit "mg/l"}
  {:id 3, :name "Nitrite Nitrogen", :unit "mg/l"}],
 :uuid "53a1649a-be67-4a13-8cba-1b7db640037c"}


(def column-x {:type :multiple
               :subtype :caddisfly
               :subtype-id  "53a1649a-be67-4a13-8cba-1b7db640037c" ;; changing caddisflyResourceId by id
               })
