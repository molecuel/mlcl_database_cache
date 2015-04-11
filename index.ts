/// <reference path="typings/node/node.d.ts"/>
/// <reference path="typings/lru-cache/lru-cache.d.ts"/>
/// <reference path="typings/mongoose/mongoose.d.ts"/>

import LRU = require('lru-cache');

class mlcl_database_cache {

  private static _instance:mlcl_database_cache = null;
  private _origFind:Function;
  private _options;
  public cache:any;

  constructor() {
    if(mlcl_database_cache._instance){
      throw new Error("Error: Instantiation failed. Singleton module! Use .getInstance() instead of new.");
    }
    mlcl_database_cache._instance = this;
  }

  public static getInstance():mlcl_database_cache {
     if(mlcl_database_cache._instance === null) {
       mlcl_database_cache._instance = new mlcl_database_cache();
     }
     return mlcl_database_cache._instance;
   }

  public install(mongoose: any, options: Object):void {
    this._options = options;
    this.cache = LRU(options);
    this._origFind = mongoose.Query.prototype.find;
    var self = this;
    mongoose.Query.prototype.find = function() {
       return self.find.call(this, 'find', arguments);
    }
  }

  public log(logmessage: String): void {
    if(this._options && this._options.debug) {
      console.log(logmessage);
    }
  }

   private find(caller: any, args: any):void {
     var self = this;

     var mlcache = mlcl_database_cache.getInstance();

     var monCache = function(key) {

       var currentQuery = self;

       var obj = mlcache.cache.get(key),
         i;

       if (obj) {
         mlcache.log('cache hit: ' + key);
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
           mlcache.log('save to cache: ' + key);
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
     }

     if(args[0] && args[0]["_id"]) {
       if(args[0]["_id"]["$in"] && args[0]["_id"]["$in"].length == 1) {
         var key = this['model'].modelName + '-' + args[0]["_id"]["$in"][0];
         monCache(key);
       } else {
         return mlcl_database_cache.getInstance()._origFind.apply(self, args);
       }
     } else {
       return mlcl_database_cache.getInstance()._origFind.apply(self, args);
     }
   }
}
export = mlcl_database_cache;
