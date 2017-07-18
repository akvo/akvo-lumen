This docker image contains an example Windshaft server
accessible via TCP port 4000 of the IP address of the docker image
configured to fetch data from the "akvo-postgis" database.

Use "make start" to start the image, then find out the IP address
of the image with something like this:

```sh
TIP=`docker inspect akvo-tiler | grep '"IPAddress":' | head -1 | sed 's/.*: "//;s/".*//'`
firefox ../../viewer/index.html?url=http://${TIP}:4000/akvo/layergroup
```
