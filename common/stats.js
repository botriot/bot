var settings = require('../settings')
  , client = settings.redis
  , logger = settings.logger(module)
  , _ = require('underscore')

var currentTimestamp = function() {
  return Math.floor(Date.now() / 1000)
}

var normalizeDay = function(timestamp) {
  var day = new Date(timestamp * 1000)
  day.setUTCHours(0)
  day.setUTCMinutes(0)
  day.setUTCSeconds(0)

  return Math.floor(day.getTime() / 1000)
}

var normalizeMinutes = function(timestamp, count) {
  var day = normalizeDay(timestamp)
  if (count >= 1440) {
    return day
  }

  count *= 60

  return day + (Math.floor((timestamp - day) / count) * count)
}

var counterTable = 'NOBITCOUNTERS'
var counterTSTable = 'TS_'+counterTable

var get = function(counts, callback, hash) {
  hash = hash || counterTable

  var multi = client.multi()
  var keys = []
  Object.keys(counts).sort().forEach(function(key) {
    var val = counts[key]
    if (val instanceof Array) {
      val.forEach(function(v) {
        keys.push(key+':'+v)
      })
    } else {
      keys.push(key+':'+val)
    }
  })

  keys.forEach(function(key) {
    multi.hmget(hash, key)
  })

  multi.exec(function(err, replies) {
    if(err) {
      logger.error("error retrieving redis values", err.stack || err)
      return callback(err)
    }
    _.flatten(replies)
    var stats = {}
    keys.forEach(function(key) {stats[key] = {}})
    for(var i = 0; i < keys.length; i++) {
      var value = replies[i]
      if(!value || value === null || value === '') {
        value = 0
      } else {
        value = Number(value)
      }
      var key = keys[i]
      stats[key] = value
    }
    callback(err, stats)
  })
};

module.exports = {
  increment: function(counts) {
    var ts = currentTimestamp()
    var multi = client.multi()
    Object.keys(counts).forEach(function(key) {
      multi.hincrby(counterTable, key+':'+counts[key], 1)
      multi.hincrby(counterTSTable, key+':'+normalizeDay(ts)+':'+counts[key], 1)
      multi.hincrby(counterTSTable, key+':'+normalizeMinutes(ts, 60)+':'+counts[key], 1)
      multi.sadd(counterTable, key)
      multi.sadd(counterTSTable, key)
    })

    multi.exec(function(err, replies) {
      if(err) logger.error('incrementing failed', err.stack || err)
    })
  },

  get: get,
  getHour: function(counts, ts, callback) {
    var c = {}
    Object.keys(counts).forEach(function(count) {
      c[count+':'+normalizeMinutes(ts, 60)] = counts[count]
    })
    get(c, callback, counterTSTable)
  },

  getDay: function(counts, ts, callback) {
    var c = {}
    Object.keys(counts).forEach(function(count) {
      c[count+':'+normalizeDay(ts)] = counts[count]
    })
    get(c, callback, counterTSTable)
  },

  normalizeMinutes: normalizeMinutes,
  currentTimestamp: currentTimestamp,
  normalizeDay: normalizeDay
}




