module.exports.log_level = 'debug';
module.exports.global_cache_ttl = 60000;
module.exports.global_reap_interval = 10000;
module.exports.global_emit_stats_interval = 10000;
module.exports.default_layergroup_ttl = 900000;
module.exports.redis = {
    host: 'redis',
    max: 10
};
module.exports.renderer = {
    mapnik: {
        metatile: 4,
        bufferSize: 0 // no need for a buffer as it is just useful if we have labels/tags in the map.
    }
};
module.exports.enable_cors = false;
module.exports.statsd = {
    host: 'statsd-server',
    port: 8125,
    prefix: 'dev.'+ require("os").hostname() + ".",
    cacheDns: true
};