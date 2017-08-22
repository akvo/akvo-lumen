var Server = require('./http/server');
var _         = require('underscore');
var merge = require('merge-deep');
var default_environment = require('./default-config.js');
var winston = require('winston');

var PORT = 4000;

global.environment  = require('/config/environment.js');

just_global_properties = {
    redis: {
        idleTimeoutMillis: global.environment.global_cache_ttl,
        reapIntervalMillis: global.environment.global_reap_interval,
        emitter: {
          statusInterval: global.environment.global_emit_stats_interval
        }
    },
    renderer: {
        mapnik: {
            statsInterval: global.environment.global_emit_stats_interval,
            metatileCache: {
                ttl: global.environment.global_cache_ttl
             },
            geojson: {
               dbPoolParams: {
                  idleTimeout: global.environment.global_cache_ttl,
                  reapInterval: global.environment.global_reap_interval
               }
            }
        },
        torque: {
            dbPoolParams: {
                idleTimeout: global.environment.global_cache_ttl,
                reapInterval: global.environment.global_reap_interval
            }
        }
    },
    renderCache: {
        ttl: global.environment.global_cache_ttl,
        statsInterval: global.environment.global_emit_stats_interval
    }
};

global.environment = merge(merge(default_environment,just_global_properties), global.environment);

winston.configure({
  level: global.environment.log_level,
  transports: [
    new (winston.transports.Console)({
      timestamp: function() {
        return new Date().toISOString();
      }
    })
  ]
});

winston.debug('Using configuration', global.environment);

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

var server = new Server(config, global.environment.default_layergroup_ttl);
server.listen(PORT, function() {
    winston.info("map tiles are now being served out of: http://localhost:" + PORT + config.base_url_mapconfig);
});
