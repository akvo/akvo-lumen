## Preconfigured Keycloak Docker image

## Usage

```
cd $LUMEN_ROOT_SOURCE/keycloak
./server.sh build
```

After a successful build
```
./server.sh run
```

Open your browser: http://localhost:8080


## Update Keycloak data

Start by downloading the current Keycloak version.

```
$ bin/add-user-keycloak.sh --user admin --password password
$ bin/standalone.sh
```
Stear a browser to http://localhost:8080, login with admin / password.

Create your realm. Quit the server process.


```
$ bin/standalone.sh -Dkeycloak.migration.action=export -Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=akvo.json
```
After the export the server will boot so we need to quit and then copy the akvo.json file to the keycloak folder in the Lumen repo. Make sure to update docs in information in the main README.md.
