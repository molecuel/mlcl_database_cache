/// <reference path="typings/node/node.d.ts"/>
/// <reference path="typings/lru-cache/lru-cache.d.ts"/>
/// <reference path="typings/mongoose/mongoose.d.ts"/>
var LRU = require('lru-cache');
var mlcl_database_cache = (function () {
    function mlcl_database_cache() {
        if (mlcl_database_cache._instance) {
            throw new Error("Error: Instantiation failed. Singleton module! Use .getInstance() instead of new.");
        }
        mlcl_database_cache._instance = this;
    }
    mlcl_database_cache.getInstance = function () {
        if (mlcl_database_cache._instance === null) {
            mlcl_database_cache._instance = new mlcl_database_cache();
        }
        return mlcl_database_cache._instance;
    };
    mlcl_database_cache.prototype.install = function (mongoose, options) {
        this.cache = LRU(options);
        this._origFind = mongoose.Query.prototype.find;
        var self = this;
        mongoose.Query.prototype.find = function () {
            return self.find.call(this, 'find', arguments);
        };
    };
    mlcl_database_cache.prototype.find = function (caller, args) {
        var self = this;
        var mlcache = mlcl_database_cache.getInstance();
        var monCache = function (key) {
            var currentQuery = self;
            var obj = mlcache.cache.get(key), i;
            if (obj) {
                console.log('cache hit: ', key);
                for (i = 0; i < args.length; i++) {
                    if (typeof args[i] === 'function') {
                        args[i](null, obj);
                        break;
                    }
                }
                return self;
            }
            function cacheSet(err, obj) {
                if (!err && obj) {
                    console.log('save to cache: ', key);
                    mlcache.cache.set(key, obj);
                }
                this.apply(self, arguments);
            }
            for (i = 0; i < args.length; i++) {
                if (typeof args[i] !== 'function')
                    continue;
                args[i] = (cacheSet).bind(args[i]);
            }
            return mlcl_database_cache.getInstance()._origFind.apply(self, args);
        };
        if (args[0] && args[0]["_id"]) {
            if (args[0]["_id"]["$in"] && args[0]["_id"]["$in"].length == 1) {
                monCache(args[0]["_id"]["$in"][0]);
            }
            else {
                return mlcl_database_cache.getInstance()._origFind.apply(self, args);
            }
        }
        else {
            return mlcl_database_cache.getInstance()._origFind.apply(self, args);
        }
    };
    mlcl_database_cache._instance = null;
    return mlcl_database_cache;
})();
module.exports = mlcl_database_cache;
