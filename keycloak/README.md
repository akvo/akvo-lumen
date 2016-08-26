
## Preconfigured Keycloak Docker image

## Usage

````
cd $LUMEN_ROOT_SOURCE/keycloak
./server.sh build
````

After a successful build
````
./server.sh run
````

Open your browser: http://localhost:8080

### Users

* Admin user to login into management console
  * username: `admin` , password: `admin`
* Lumen user to login into the web application
  * username: `lumen` , password: `lumen`
