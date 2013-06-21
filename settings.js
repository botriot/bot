var _ = require('underscore')

exports.logger = require('nlogger').logger

var logger = exports.logger(module)

var config = exports.config = {
  mongo: {url: 'mongodb://localhost/nobits3'},
  twitter: {
    hostname: '',
    consumerKey: '',
    consumerSecret: ''
  },
  socketio: {
    loglevel: 2,
  },

  credentials: {

    bitly: {
      username: '',
      apikey: ''
    },
    dictionary: {
      apiKey: ''
    },
    dnsimple: {
      username: '',
      password: ''
    },
    fanfeedr: {
      apikey: ''
    },
    foodspotting: {
      apikey: '',
      apisecret: ''
    },
    lastfm: {
      apikey: ''
    },
    microsoft: {
      apikey: ''
    },
    musixmatch: {
      apikey: ''
    },
    rottentomatoes: {
      apikey: ''
    },
    simplegeo: {
      apikey: ''
    },
    tumblr: {
      apikey: '',
      apisecret: ''
    },
    wordnik: {
      apikey: ''
    },
    yahoo: {
      appid: '',
      apikey: '',
      apisecret: ''
    }
  },

  hook: {},

  redis: {},

  admins: ['wadey', 'jonrohan', 'caseycrites', 'dsmitts'],
}

var envConfig = {
  production: {
    twitter: {
      hostname: '',
      consumerKey: '',
      consumerSecret: ''
    }
  }
}

_.extend(config, envConfig[process.env.NODE_ENV])

exports.production = process.env.NODE_ENV === 'production'

//
//
//

var redis = require('redis')

exports.mongoose = require('mongoose')

var Hook = require('hook.io').Hook

exports.init = function(name) {
  name = name || 'nobits'
  exports.name = name

  exports.redis = redis.createClient()
  exports.mongoose.connect(config.mongo.url, {auto_reconnect: true})

  exports.hook = new Hook({
    name: name,
    debug: name === 'hookd'
  })
  if (name === 'hookd') {
    exports.hook.listen()
  } else {
    exports.hook.connect()
  }

  var RedisStore = require('connect-redis')(require('express'));
  exports.sessionStore = new RedisStore

  return exports
}

exports.destroy = function() {
  if (exports.hook && exports.hook.conn) {
    logger.info("closing hook")
    exports.hook.conn.end()
    delete exports.hook
  }
  exports.mongoose.disconnect()
  logger.info("closing mongoose")
}
