function lumen-request --description "Pads httpie requests with Keycloak access token. Use set-lumen-request-token. Urls with ? needs to be quoted."
         eval http (echo "$argv") (echo "authorization:'Bearer $AKVO_LUMEN_ACCESS_TOKEN'")
end
