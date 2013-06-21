"use strict"

var settings = require('./settings')
  , logger = settings.logger(module)
  , hook = settings.hook
  , services = require('./common/services')
  , models = require('./models')
  , async = require('async')
  , _ = require('underscore')

module.exports = function(app, socket) {
  // Socket.io

  socket.on('sconnection', function(client, session) {
    client.emit('connect-session')
    logger.debug('connected')

    function botStatusCallback(err, message) {
      if (err) {
        logger.error('botStatus error', err)
        message = 'Could not retrieve bot status!'
      }

      client.emit('botStatusResponse', message)
    }

    function browserChatCallback(err, message) {
      if (err) {
        logger.error("browser chat error", err)
        client.emit('browserChatResponse', 'Ack! There was a problem executing command')
      } else {
        if (session && session.user) {
          var bot = models.User.bot(session.user)
          if(bot) {
            message = {message: message, bot: bot}
          }
        }
        client.emit('browserChatResponse', message)
      }
    }

    client.on('disconnect', function(client) {
      logger.debug('disconnected')
    })

    // Demo Bot Events

    client.on('browserChatMessage', function(message) {
      logger.debug('browserChatMessage')
      message.callback = browserChatCallback
      if (session && session.user) {
        var bot = models.User.bot(session.user)
        if(bot) {
          message.bot = {_id: bot._id, name: bot.name}
          message.user = session.user._id
        }
      }

      hook.emit('browserChatMessage', message)
    })

    client.on('setBotName', function(message) {
      var name = message.message
      if (!name.match(/^[A-za-z0-9]+$/)) {
        return false
      }
      logger.debug('setting bot name to ' + name)


      // TODO: Lots of opportunities for errors to be
      // generated. We might want to inform the person
      // on the other line that there is an issue.

      // If we don't find the user here then we have
      // a serious problem
      models.User.findById(session.user._id, function (err, user) {
        var bot = models.User.bot(user)
        bot.name = name

        user.save(function(err) {
          if (err) return next(err)
          models.Bot.spawn(user, bot)

          // TODO: Abstract out the set session user
          // Need to make sure that this value is in JSON
          // format since it gets passed around a lot.
          session.user = user.toJSON()
          client.emit('userDidUpdate', {user: session.user, bot: models.User.bot(session.user)})
        })
      })
    })

    client.on('getCommands', function(message) {
      var commandSets = models.allCommands()

      var bot = models.User.bot(session.user)

      _.each(commandSets, function(set) {
        _.each(set, function(command) {
          if (command.help) {
            command.help = command.help.replace(/BOT/g, bot.name)
          }
        })
      })

      client.emit('getCommandsResults', commandSets)
    })

    client.on('getBotServices', function(message) {
      var bot = models.User.bot(session.user)

      var authService = function(service, callback) {
        services.services()[service].authService(models.Bot.service(bot, service) || {}, callback)
      }

      async.map(Object.keys(services.services()), authService, function (err, results) {
        if(err) {
          logger.error(err.stack)
          client.emit('getBotServicesResults', [])
        } else {
          client.emit('getBotServicesResults', results)
        }
      })
    })

    client.on('getUser', function(message) {
      var response = {
        user: session.user,
        bot: models.User.bot(session.user)
      }

      client.emit('getUserResponse', response)
    })

    client.on('botStatus', function(message) {
      logger.debug('botStatus')
      if (session.user !== undefined && models.User.bot(session.user) !== undefined) {
        hook.emit('botStatus', {user: session.user._id, bot: models.User.bot(session.user), callback: botStatusCallback})
      }
    })

    client.on('authService', function(message) {
      models.User.findById(session.user._id, function(err, user) {
        if (err) {
          logger.error(err)
          client.emit('authServiceResults', {type:message.type, error: 'Could not find user'})
          return
        }

        var bot = models.User.bot(user)
        if(!bot.services || bot.services.length === 0) {
          bot.services = [new models.Service(message)]
        } else {
          bot.services = bot.services.filter(function(service) {return service.type !== message.type}).concat([new models.Service(message)])
        }
        models.Bot.spawn(user, models.User.bot(user), function(err, msg) {
          if(err) {
            logger.error(err)
            client.emit('authServiceResults', {type:message.type, error: err})            
            return
          }
          user.save(function(err) {
            if (err) {
              logger.error(err)
              client.emit('authServiceResults', {type:message.type, error: 'Could not save user'})
              return
            }
            client.emit('authServiceResults', msg)
          })
        })
      })
    })
  })
}
