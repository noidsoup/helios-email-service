/*
    This is ia helper function to handle caching.
    Caching is done through a combination of Redis, Mongoose and MongoDB.
    Note the modification of the Moongoose query() method;
    The Redis key for caching is the a combination of the query and the _id of the calling app.
    This function is activated by the call to .cache in the calling controller/router. Therefore, not all requests are cached.
    Redis object model = {
        hashKey: {
            rediskey : value
        }
    }
    The hashKey is OPTIONAL and passed in by any funtion calling .cache()
    Example: .cache({ key: req.user._id});

*/
const config = require("../config");
const mongoose = require("mongoose");
const redis = require("redis");
const util = require("util");
// const assert = require('assert');

const redis_host = process.env.REDIS_HOST;

console.log('-----------process.env.REDIS_HOST---------------', "$REDIS_HOST");
const client = redis.createClient({host: "$REDIS_HOST"});
client.hget = util.promisify(client.hget); // Turns the redis get() into a promise.

// Adapting the Moongoose query method to work for our needs.

const { exec } = mongoose.Query.prototype; // Destructure exec function from Mongoose QUERY() prototype.

// Add a cache() function to the Mongoose Query object so it can be called like others - find, findOne, etc.
// Function and NOT () => {} so that THIS can give us access to current function properties.
// eslint-disable-next-line func-names
mongoose.Query.prototype.cache = function(options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || '');
  return this; // makes the cache() function chainable.
};
// CUSTOM EXEC FUCTION //
// eslint-disable-next-line func-names
mongoose.Query.prototype.exec = async function(...args) {
  // if a controller function does not call .cache(), use normal Mongoose .exec() function
  if (!this.useCache) {
    return exec.apply(this, ...args);
  }
  const query = this.getQuery();
  const collection = this.mongooseCollection.name;
  const redisKey = JSON.stringify({ ...{}, query, collection }); // Combines query and collection to form a unique key.
  // Check to see if the exact query has been executed in redis.
  const cacheValue = await client.hget(this.hashKey, redisKey);
  console.log(redisKey)

  // if yes, convert the cache value to json, then mogoose object, and return the result right away.
  if (cacheValue) {
    const doc = JSON.parse(cacheValue);
    return Array.isArray(doc)
      ? doc.map(item => new this.model(item))
      : new this.model(doc);
  }
  // Otherwise, issue the query as normal. Save query result in redis.
  const result = await exec.apply(this, ...args); // Result is a Mongoose object.
  client.hset(this.hashKey, redisKey, JSON.stringify(result)); // Stringify before saving to Redis

  return result;
};

// DELETES Redis data nested in a given hashKey.
// Used in middlewares/cleancache.js
module.exports = {
  clearCache(hashKey) {
    client.del(JSON.stringify(hashKey));
  },
  clearAllCache() {
    client.flushall();
  }
};
