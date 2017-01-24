function set-lumen-request-token --description "Prepare lumen-request."
         set url http://localhost:8080/auth/realms/akvo/protocol/openid-connect/token
         set -g -x AKVO_LUMEN_ACCESS_TOKEN (
             http --form POST $url username='jerome' \
                  password='password' \
                  client_id='lumen' \
                  grant_type=password \
                  | jq '.access_token' | tr -d '"')
        echo $AKVO_LUMEN_ACCESS_TOKEN
end
