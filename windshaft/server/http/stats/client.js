var _ = require('underscore');
var Lynx = require('lynx');

module.exports = {
    /**
     * Returns an Lynx instance or an stub object that replicates the StatsD public interface so there is no need to
     * keep checking if the stats_client is instantiated or not.
     *
     * The first call to this method implies all future calls will use the config specified in the very first call.
     *
     * We proceed this way to be able to use StatsD from several places sharing one single StatsD instance.
     *
     * @param config Configuration for Lynx, if undefined it will return an stub
     * @returns {StatsD|Object}
     */
    getInstance: function(config) {

        if (!this.instance) {

            var instance;

            if (config) {
                instance = new Lynx(config.host, config.port, config);
            } else {
                var stubFunc = function (stat, value, sampleRate, callback) {
                    if (_.isFunction(callback)) {
                        callback(null, 0);
                    }
                };
                instance = {
                    timing: stubFunc,
                    increment: stubFunc,
                    decrement: stubFunc,
                    gauge: stubFunc,
                    unique: stubFunc,
                    set: stubFunc,
                    sendAll: stubFunc,
                    send: stubFunc
                };
            }

            this.instance = instance;
        }

        return this.instance;
    }
};