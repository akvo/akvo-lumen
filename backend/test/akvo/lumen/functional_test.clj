(ns akvo.lumen.functional-test)

#_(use-fixtures :once system-fixture)

#_(deftest ^:functional ping-collections

  (testing "Root endpoint - status code"
    (let [resp (client/get "http://localhost:3000/api")]
      (is (= 200 (:status resp)))))
  ;
  ;(testing "Dataset endpoint - status code"
  ;  (let [resp (client/get "http://localhost:3000/api/datasets")]
  ;    (is (= 200 (:status resp)))))
  ;
  ;(testing "Library endpoint - status code"
  ;  (let [resp (client/get "http://localhost:3000/api/library")]
  ;    (is (= 200 (:status resp)))))

  ;(testing "Visualisations endpoint - status code"
  ;  (let [resp (client/get "http://localhost:3000/api/visualisations")]
  ;    (is (= 200 (:status resp)))))
  ;
  ;(testing "Activity endpoint - status code"
  ;  (let [resp (client/get "http://localhost:3000/api/activities")]
  ;    (is (= 200 (:status resp)))))
  )


#_(deftest ^:wip ping-wip

  (testing "Dataset endpoint - status code"
    (let [resp (client/get "http://locwalhost:3000/api/datasets/does-not-exists")]
      (is (= 404 (:status resp))))))
