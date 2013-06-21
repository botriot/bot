var settings = require('../settings').init('bot')
  , logger = settings.logger(module)

var _ = require('underscore')
  , assert = require('assert')

var Bot = require('./bot')
  , Bots = require('./bots')
  , Demo = require('../common/services/demo')
  , UserError = require('../common/exceptions').UserError

var demoBotUser = 'XXX'
  , demoBotName = 'Botriot'
  , demoBotConfig = {_id: 'XXX', name: demoBotName, services:[{type:'demo'}]}

settings.hook.on('*::botUpdated', function(config) {
  var botConfig = config.bot
    , userId = config.user
    , callback = config.callback
  logger.debug("received event for botUpdated: (" + Bots.botId(userId, botConfig) + ' ' + JSON.stringify(botConfig.services) + ")")
  Bots.updateOrCreate(userId, botConfig, callback)
})

settings.hook.on('*::status', function(config) {
  Bots.status(config.callback)
})

settings.hook.on('*::botStatus', function(config) {
  logger.debug("recieved event for botStatus")
  var botConfig = config.bot
    , userId = config.user
    , callback = config.callback
  var bot = Bots.get(userId, botConfig)
  if (bot === undefined) {
    callback(new UserError('no bot named ' + botConfig.name))
  } else if (callback) {
    bot.status(callback)
  }
})

settings.hook.on('*::browserChatMessage', function(config) {
  var message = config.message
  var callback = config.callback

  // TODO simplify
  if (config.bot) {
    logger.debug("recieved event for browserChatMessage")
    var bot = Bots.get(config.user, config.bot)
    if (!bot) {
      callback("No such bot")
    } else {
      new Demo(bot.commands, {}, bot).handleMessage(message, callback)
    }
  } else {
    logger.info("Demo chat: " + message)
    var demoBot = Bots.get(demoBotUser, demoBotConfig)
    if (!demoBot) {
      Bots.createBot(demoBotUser, demoBotConfig, function(err, bot) {
        if (err) {
          logger.error(err.stack)
          callback(err)
        } else {
          bot.services[0].handleMessage(message, callback)
        }
      })
    } else {
      demoBot.services[0].handleMessage(message, callback)
    }
  }
})

settings.hook.on('*::broadcast', function(msg) {
  logger.debug('recieved broadcast message: ' + msg.msg)
  Bots.broadcast(msg.msg, msg.serviceType, msg.botId)
})

process.once('SIGINT', function() {
  logger.warn("SIGINT")
  settings.destroy()
  Bots.destroyAll()
})


process.on('uncaughtException', function(err) {
  // We don't want to crash the server
  // We should try to make sure this isn't catastrophic

  logger.error(err.stack || err)

  // TODO send an email to our team
})

if (require.main === module) {
  logger.info("Bot server starting")
  require('../models')

  // TODO loop through bots instead
  Bots.startup()
}
