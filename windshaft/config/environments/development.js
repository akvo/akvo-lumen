module.exports.name = 'development';
module.exports.redis = {
// TODO: it emits some events. See if they are published somewhere already of it we should subscribe to them
// see https://github.com/CartoDB/node-redis-mpool/blob/master/index.js#L26
// and https://github.com/coopernurse/node-pool
    host: 'redis',
    port: 6379,
    log: false, // should be false in prod
    max: 50, //TODO: review, depends on load and server
    idleTimeoutMillis: 60000,
    default_layergroup_ttl: 900, // in seconds, this config is not used by Redis itself but by /windshaft/storages/mapstore.js
    returnToHead: true,
    reapIntervalMillis: 60000,
    emitter: {
        statusInterval: 10000 // time, in ms, between each status report is emitted from the pool, status is sent to statsd
    },
    slowQueries: {
        log: true,
        elapsedThreshold: 200
    },
    slowPool: {
        log: true, // whether a slow acquire must be logged or not
        elapsedThreshold: 25 // the threshold to determine an slow acquire must be reported or not
    }
    // This config is for node-pool v3
//    maxWaitingClients: 10,
//    acquireTimeoutMillis: 100
};
module.exports.renderer = {
    mapnik: {
        poolSize: require('os').cpus().length,
        statsInterval: 1000, // need to do something like lib/cartodb/stats/reporter/renderer.js
        metatile: 4,
        metatileCache: {
            ttl: 60000,
            deleteOnHit: true
        },
        bufferSize: 0, // no need for a buffer as it is just useful if we have labels/tags in the map.
        scale_factors: [1, 2],
        limits: {
            render: 10000,
            cacheOnTimeout: true
        },
        geojson: {
            dbPoolParams: {
                  // maximum number of resources to create at any given time
                  size: 16,
                  // max milliseconds a resource can go unused before it should be destroyed
                  idleTimeout: 30000,
                  // frequency to check for idle resources
                  reapInterval: 10000
            },

            // SQL queries will be wrapped with ST_ClipByBox2D
            // Returning the portion of a geometry falling within a rectangle
            // It will only work if snapToGrid is enabled
            clipByBox2d: false, // this requires postgis >=2.2 and geos >=3.5
            // geometries will be simplified using ST_RemoveRepeatedPoints
            // which cost is no more expensive than snapping and results are
            // much closer to the original geometry
            removeRepeatedPoints: false // this requires postgis >=2.2
        }
    },
    torque: {
        dbPoolParams: {
            size: 16,
            idleTimeout: 30000,
            reapInterval: 10000
        }
    }
    // TODO: provide a onTileErrorStrategy????
};
module.exports.mapnik_version = undefined; // will be looked up at runtime if undefined
module.exports.enable_cors = false;
module.exports.enabledFeatures = {
    // whether in mapconfig is available stats & metadata for each layer
    layerMetadata: true
};
module.exports.statsd = {
        host: 'statsd-server',
        port: 8125,
        prefix: 'dev.'+ require("os").hostname() + ".",
        cacheDns: true
        // support all allowed node-statsd options
};
module.exports.renderCache = {
    ttl: 60000, // 60 seconds TTL by default
    statsInterval: 10000 // reports stats every milliseconds defined here
};