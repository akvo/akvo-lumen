//  - Reports stats about:
//    * Total number of renderers
//    * For mapnik renderers:
//      - the mapnik-pool status: count, unused and waiting
//      - the internally cached objects: png and grid

var _ = require('underscore');

function RendererStatsReporter(rendererCache, redisPool, mapController, appmetrics, statsInterval) {
    this.rendererCache = rendererCache;
    this.redisPool = redisPool;
    this.mapController = mapController;
    this.appmetrics = appmetrics;
    this.statsInterval = statsInterval || 6e4;
    this.renderersStatsIntervalId = null;
}

module.exports = RendererStatsReporter;

RendererStatsReporter.prototype.start = function() {
    var self = this;
    this.renderersStatsIntervalId = setInterval(function() {
        var rendererCacheEntries = self.rendererCache.renderers;

        if (!rendererCacheEntries) {
            return null;
        }

        global.statsClient.gauge('windshaft.rendercache.count', _.keys(rendererCacheEntries).length);

        var renderersStats = _.reduce(rendererCacheEntries, function(_rendererStats, cacheEntry) {
                var stats = cacheEntry.renderer && cacheEntry.renderer.getStats && cacheEntry.renderer.getStats();
                if (!stats) {
                    return _rendererStats;
                }

                _rendererStats.pool.count += stats.pool.count;
                _rendererStats.pool.unused += stats.pool.unused;
                _rendererStats.pool.waiting += stats.pool.waiting;

                _rendererStats.cache.grid += stats.cache.grid;
                _rendererStats.cache.png += stats.cache.png;

                return _rendererStats;
            },
            {
                pool: {
                    count: 0,
                    unused: 0,
                    waiting: 0
                },
                cache: {
                    png: 0,
                    grid: 0
                }
            }
        );

        global.statsClient.gauge('windshaft.mapnik-cache.png', renderersStats.cache.png);
        global.statsClient.gauge('windshaft.mapnik-cache.grid', renderersStats.cache.grid);

        global.statsClient.gauge('windshaft.mapnik-pool.count', renderersStats.pool.count);
        global.statsClient.gauge('windshaft.mapnik-pool.unused', renderersStats.pool.unused);
        global.statsClient.gauge('windshaft.mapnik-pool.waiting', renderersStats.pool.waiting);
    }, this.statsInterval);

    this.rendererCache.on('err', rendererCacheErrorListener);
    this.redisPool.on('status', redisStats);
    this.mapController.on('perf', perfStats);

    this.appmetrics.enable('eventloop');
    this.appmetrics.enable('redis');
    this.appmetrics.enable('postgres');

    this.appmetrics.on('cpu', function handleCPU(cpu) {
    	global.statsClient.gauge('cpu.process', cpu.process);
        global.statsClient.gauge('cpu.system', cpu.system);
	});

	this.appmetrics.on('memory', function handleMem(memory) {
		global.statsClient.gauge('memory.process.private', memory.private);
		global.statsClient.gauge('memory.process.physical', memory.physical);
		global.statsClient.gauge('memory.process.virtual', memory.virtual);
		global.statsClient.gauge('memory.system.used', memory.physical_used);
		global.statsClient.gauge('memory.system.total', memory.physical_total);
	});

	this.appmetrics.on('eventloop', function handleEL(eventloop) {
		global.statsClient.gauge('eventloop.latency.min', eventloop.latency.min);
		global.statsClient.gauge('eventloop.latency.max', eventloop.latency.max);
		global.statsClient.gauge('eventloop.latency.avg', eventloop.latency.avg);
	});

	this.appmetrics.on('gc', function handleGC(gc) {
		global.statsClient.gauge('gc.size', gc.size);
		global.statsClient.gauge('gc.used', gc.used);
		global.statsClient.timing('gc.duration', gc.duration);
	});


	this.appmetrics.on('redis', function handleRedis(redis) {
		global.statsClient.timing('redis.' + redis.cmd, redis.duration)
	});

	this.appmetrics.on('postgres', function handlePostgres(postgres) {
		global.statsClient.timing('postgres', postgres.duration)
	});
};

function rendererCacheErrorListener() {
    global.statsClient.increment('windshaft.rendercache.error');
}

function perfStats(times) {
    setImmediate(function () {
        Object.keys(times).forEach(function (key) {
         global.statsClient.timing('windshaft.perf.' + key, times[key]);
       });
    });
}

function redisStats(stats) {
    global.statsClient.gauge('windshaft.redis-pool.count', stats.count);
    global.statsClient.gauge('windshaft.redis-pool.unused', stats.unused);
    global.statsClient.gauge('windshaft.redis-pool.waiting', stats.waiting);
}

RendererStatsReporter.prototype.stop = function() {
    this.rendererCache.removeListener('err', rendererCacheErrorListener);
    this.redisPool.removeListener('status', redisStats);

    clearInterval(this.renderersStatsIntervalId);
    this.renderersStatsIntervalId = null;
};
