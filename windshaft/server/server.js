var Server = require('./http/server');
var _         = require('underscore');

// Force 'development' environment
var ENV = 'development';
var PORT = 4000;

// set environment specific variables
global.environment  = require('../config/environments/' + ENV);

// TODO: mml-builder has a use_workers flag in line 40

var config = {
    base_url_mapconfig: '/:dbname/layergroup',
    grainstore: {
    }, //see grainstore npm for other options
    redis: global.environment.redis,
    renderer: global.environment.renderer,
    enable_cors: false,
    statsd: global.environment.statsd,
    renderCache: global.environment.renderCache,
    req2params: function(req, callback){

        // this is in case you want to test sql parameters eg ...png?sql=select * from my_table limit 10
        req.params =  _.extend({}, req.params);

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

var server = new Server(config);
server.listen(PORT, function() {
    console.log("map tiles are now being served out of: http://localhost:" + PORT + config.base_url_mapconfig);
});
