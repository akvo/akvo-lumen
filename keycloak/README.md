
## Preconfigured Keycloak Docker image

## Usage

````
cd $LUMEN_ROOT_SOURCE/keycloak
docker build -t akvo/keycloak .
````

After a successful build
````
docker run -p 8080:8080 akvo/keycloak
````

Open your browser: http://localhost:8080

### Users

* Admin user to login into management console
  * username: `admin` , password: `admin`
* Lumen user to login into the web application
  * username: `lumen` , password: `lumen`
