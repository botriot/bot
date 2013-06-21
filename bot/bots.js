var settings = require('../settings').init('bot')
  , logger = settings.logger(module)

var _ = require('underscore')
  , assert = require('assert')

var Bot = require('./bot')

var bots = []

exports.broadcast = function(msg, serviceType, botId) {
  if(msg !== undefined) {
    if(botId === 'global') {
      Object.keys(bots).forEach(function(id) {
        var bot = bots[id]
        bot.broadcast(msg, serviceType)
      })
    } else if(botId) {
      var bot = bots[botId]
      if(bot) {
        bot.broadcast(msg, serviceType)
      }
    }
  }
}

exports.status = function(callback) {
  var stats = {}
  var keys = Object.keys(bots)
  stats['total'] = keys.length

  // TODO: Figure this out
  // stats['total_running'] = keys.length

  stats['services'] = {campfire:0, irc:0}
  stats['connected'] = 0
  
  keys.forEach(function(key) {
    var bot = bots[key]
    if(bot.services.length > 0) stats.connected ++
    // TODO: Fix this when we support multiple rooms
    bot.services.forEach(function(service) {
      stats.services[service.type] += 1
    })
  })

  callback(undefined, stats)
}

exports.updateOrCreate = function(userId, botConfig, callback) {
  var id = botId(userId, botConfig)
    , bot = bots[id]
  
  if (bot) {
    logger.debug("updating: " + id)
    bot.update(botConfig)
    bot.destroy(function(err) {
      if (err) logger.error(err.stack || err)
      bot.connect(function(err) {
        if (err) {
          logger.error(err.stack || err)
        }
        if (callback) callback(err)
      })
    })
  } else {
    logger.debug("creating: " + id)
    exports.createBot(userId, botConfig, callback)
  }
}

exports.get = function(userId, config) {
  return bots[botId(userId, config)]
}

function botId(userId, botConfig) {
  if (!botConfig._id) {
    throw new Error()
  }
  return userId + ':' + botConfig._id
}
exports.botId = botId

exports.createBot = function(userId, config, callback) {
  assert.ok(!bots[botId(userId, config)])
  var bot = new Bot(userId, config)
  bots[botId(userId, config)] = bot
  bot.connect(function(err) {
    if (callback) {
      return callback(err, bot)
    }
    if (err) {
      logger.error(err.stack || err)
    }
  })
}

exports.startup = function() {
  var User = require('../models').User
  User.find({}, function(err, users) {
    if (err) logger.error(err.stack || err)
    users.forEach(function(user) {
      user.bots.forEach(function(bot) {
        logger.info("Loading bot: " + bot.name)
        try {
          exports.createBot(user._id, bot, function(err) {
            // TODO retry or mark as failed
            if (err) logger.error(err.stack || err)
          })
        } catch(err) {
          logger.error(err.stack || err)
          logger.debug('TODO: FIX THIS!!!!!!')
        }
      })
    })
  })
}

exports.destroyAll = function() {
  _.forEach(bots, function(bot, name) {
    bot.destroy(function(err) {
      if (err) logger.error(err.stack)
    })
  })
}
