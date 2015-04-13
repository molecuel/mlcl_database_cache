var should = require('should'),
mongoose = require('mongoose'),
moncache = require('../');

describe('mlcl_database_cache', function() {
  var cacheOpts = {
    max:50,
    maxAge:1000*60*60,
    debug: true
  };

  var Cat = mongoose.model('Cat', { name: String });

  before(function (done) {
    mongoose.connect('mongodb://localhost/mongo_cache');
    done();
  });

  describe('singleton check', function() {
    it('should initialize', function(done) {
      should.not.exist(moncache._instance);
      moncache.getInstance(mongoose, cacheOpts);
      done();
    });

    it('should check if singleton', function(done) {
      //var cache = require('../index.js').mlcl_database_cache.getInstance();
      var cache = require('../index.js');
      cache._instance.should.be.an.instanceOf(Object);
      cache._instance.should.be.ok;
      done();
    });
  });

  describe('mongoose check', function() {
    var testdoc;

    before(function (done) {
      testdoc = new Cat({ name: 'Zildjian' });
      testdoc.save(function(err) {
        done();
      });
    });

    it('should init mongoose cache', function(done) {
      var cache = moncache.getInstance();
      cache.install(mongoose, cacheOpts);
      done();
    });

    it('should read from mongoose', function(done) {
      Cat.find({_id: {"$in": [testdoc._id]}}, function(err, doc) {
        should.not.exist(err);
        done();
      });
    });

    it('should read from mongoose and hit the cache', function(done) {
      Cat.find({_id: {"$in": [testdoc._id]}}, function(err, doc) {
        should.not.exist(err);
        done();
      });
    });

    it('should delete the document from cache', function(done) {
      moncache.getInstance().del(Cat.modelName, testdoc._id);
      done();
    });

    it('should read from mongoose', function(done) {
      Cat.find({_id: {"$in": [testdoc._id]}}, function(err, doc) {
        should.not.exist(err);
        done();
      });
    });

    it('should read from mongoose and hit the cache', function(done) {
      Cat.find({_id: {"$in": [testdoc._id]}}, function(err, doc) {
        should.not.exist(err);
        done();
      });
    });
  })
});
