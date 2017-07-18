// Note, currently to run this server your table must have a column called the_geom_webmercator with SRID of 3857
// to view the tiles, open ./viewer/index.html and set the fields
//
// If you want to get something running quickly, follow the instructions for a seed DB in test/windshaft.test.sql

var Server = require('./http/server');
var _         = require('underscore');

// Force 'development' environment
var ENV = 'development';
var PORT = 4000;

// set environment specific variables
global.environment  = require('../config/environments/' + ENV);

var config = {
    base_url: '/:dbname/table/:table',
    base_url_mapconfig: '/:dbname/layergroup',
    grainstore: {
       datasource: global.environment.postgres
    }, //see grainstore npm for other options
    redis: global.environment.redis,
    enable_cors: true,
    req2params: function(req, callback){

        //console.log("req2param received req: ", req);
        //console.dir(req);

        // this is in case you want to test sql parameters eg ...png?sql=select * from my_table limit 10
        req.params =  _.extend({}, req.params);

        // Set PostgreSQL setting (from environment)
        req.params.dbhost = global.environment.postgres.host;
        req.params.dbuser = global.environment.postgres.user;
        req.params.dbpassword = global.environment.postgres.password;
        req.params.dbport = global.environment.postgres.port;

        _.extend(req.params, req.query);

        if ( req.params.token )
        {
          // Separate cache buster from token
          var tksplit = req.params.token.split(':');
          req.params.token = tksplit[0];
          if ( tksplit.length > 1 ) {
              req.params.cache_buster = tksplit[1];
          }
        }

        // send the finished req object on
        callback(null,req);
    }
};

// Initialize tile server
var server = new Server(config);
server.listen(PORT, function() {
    console.log("map tiles are now being served out of: http://localhost:" + PORT + config.base_url_mapconfig);
});
