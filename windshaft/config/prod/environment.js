module.exports.redis = {
    host: 'redis-master-windshaft',
    max: 10
};
module.exports.renderer = {
    mapnik: {
        metatile: 4,
        bufferSize: 0 // no need for a buffer as it is just useful if we have labels/tags in the map.
    }
};