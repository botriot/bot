var settings = require('../../settings')
  , logger = settings.logger(module)

var _ = require('underscore')
  , URL = require('url')
  , request = require('request')
  , escapeRegex = require('../../common').escapeRegex
  , stats = require('../../common/stats')

var convert = function(timeStats) {
  var stats = {}
  Object.keys(timeStats).forEach(function(key) {
    var comps = key.split(':')
    if(comps.length > 2) {
      if(!stats[comps[0]]) {
        stats[comps[2]] = {}
      }
      stats[comps[2]] = timeStats[key]
    } else {
      if(!stats[comps[0]]) {
        stats[comps[0]] = {}
      }

      if(!stats[comps[0]][comps[1]]) {
        stats[comps[0]][comps[1]] = {}
      }
      stats[comps[0]][comps[1]] = timeStats[key]
    }
  })

  return stats
}

var getAllStats = function(counts, callback) {
  var totalStats = {}
  var ts = stats.currentTimestamp()
  stats.get(counts, function(err, replies) {
    if(err) {
      logger.error(err.stack)
      return callback(err)
    }
    callback(err, convert(replies))
  })
}

module.exports = {
  // TODO use file magic
  services: function () { return {
      irc: require('./irc'),
      campfire: require('./campfire')
   }
  },

  ensureImageUrl: function(image) {
    var parsed = URL.parse(image)
    if (!/\.(?:jpg|png|gif|jpeg)$/i.test(parsed.pathname) && !parsed.hash) {
      image += '#.jpg'
    }
    return image
  },

  getRules: function(service) {
    var commands = service.commands
      , config = service.config
      , bot = service.bot
      , prefix = service.prefix

    if (prefix === undefined) {
      var name = bot.config.name
      service.prefix = prefix = '(?:/\\s*|!\\s*|' + escapeRegex(name) + '\\s+)'
      service.prefixRegExp = RegExp('^' + prefix, 'i')
    }

    return _.map(commands, function(command, name) {
      return {
        regexp: RegExp('^'+prefix+'(' + (command.regexp || name) + ')(?:\\s*$|\\s+(.*)$)', 'i'),
        name: name,
        command: command
      }
    })
  },

  handleMessage: function(service, roomObj, message) {

    var found = false
    var bot = roomObj.bot

    service.rules.forEach(function(rule) {
      var match = message.body.match(rule.regexp)
      if (message.body.match(service.prefixRegExp)) {
        if (match) {
          found = true

          roomObj.from = message.from

          var command = match[1]
            , text = (match[2] || '').trim()
            , flags = ""
            , parser = rule.command.parser(roomObj, roomObj.paste)


          if (bot.disabled_commands && bot.disabled_commands[command]) {
            return roomObj.speak(command + ' is disabled. Enable it with !enable ' + command)
          }
          roomObj.getConfig = function (callback) {bot.getConfig(command, callback)}
          roomObj.setConfig = function (config, callback) {
            bot.setConfig(command, config, callback)
          }

          // TODO: We can remove this conditional once all of the commands
          // have been converted over to the new format
          var commandFunction = null
          if(!parser) {
            var m2 = text.match(/^me(?:\s+(.*)|(\s*))$/i)
            if (m2) {
              text = (m2[1] || '').trim()
            }

           if(text.indexOf("-") == 0) {
              var words = text.split(" ")
              flags = words[0].replace("-","")
              text = words.slice(1).join(" ")
            }

            var extMessage = _.extend({}, message, {
              command: command,
              text: text,
              flags: flags
            })

            commandFunction = function() {rule.command.func(roomObj, extMessage)}
          } else {
            commandFunction = function() {
              parser.parse(['node', command].concat(text.split(' ')))

              // If there are no commands, then we need
              // to execute the action explicitly
              if(!rule.command.commands && !parser.help) {
                var func = rule.command.func
                if(func) {
                  if (rule.command.admin) {
                    if (!roomObj.from.admin) {
                      return roomObj.speak("Admin privilege is required for this command.");
                    }
                  }
                  func(roomObj, parser.args.join(" "), parser)
                }
              }
            }
          }

          try {
            commandFunction()
            // Increment stats
            var messageStats = {}
            messageStats[service.type] = rule.command.key || command
            messageStats[service.bot.userId] = rule.command.key || command
            stats.increment(messageStats)

          } catch (err) {
            logger.error('unable to handle command '+ command + ' with text ' + text + ': ' + err.stack)
            // Send a notification to the room saying that
            // we were unable to handle the command
            if(roomObj.speak && rule && rule.command) {
              roomObj.speak('It appears that "'+ command + '" does not want to work properly. The proper party has been notified.')
            }
          }
        }
      }
      
      if(bot.disabled_commands && bot.disabled_commands[rule.command.name]) return
      
      // If a full message is request, we send the body of the message
      // as the first argument and the extra jazz as the third argument
      if(rule.command.fullmessage) {
        rule.command.fullmessage(roomObj, message.body, message)
      }

    })

    if (!found&&message.body.match(service.prefixRegExp) && !roomObj.bot.demo) {
      roomObj.bot.getWebHook(function(err, url) {
        if (err) return logger.error(err.stack)

        var msg = message.body.replace(service.prefixRegExp, '').trim()

        if (url) {
          request.post({
            uri: url,
            json: {
              service: message.service,
              text: msg,
              from: message.from,
              room: message.room,
              date: +message.date
            },
          }, function(err, res, body) {
            if (err) {
              return roomObj.speak("Error connecting to webhook server")
            }

            if (res.statusCode === 200) {
              if (body.speak) {
                roomObj.speak(body.speak)
              } else if (body.paste) {
                roomObj.paste(body.paste)
              } else if (body.image) {
                roomObj.image(body.image)
              }
            } else {
              roomObj.speak("Webhook returned status code " + res.statusCode)
            }
          })
        }
      })
    }
  },

  getCommandStats: function(service, callback) {
    var messageStats = {}
    messageStats[service.bot.userId] = Object.keys(service.commands)
    getAllStats(messageStats, function(err, stats) {

      // Filter out the bot id key
      if(stats) {
        stats = stats[Object.keys(stats)[0]]
      }

      callback(err, stats)
    })
  },

  getGlobalCommandStats: function(services, commands, callback) {
    var messageStats = {}
    services.forEach(function(name) {
      messageStats[name] = commands
    })
    getAllStats(messageStats, callback)
  }
}
