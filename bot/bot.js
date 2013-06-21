"use strict"

var settings = require('../settings')

var _ = require('underscore')
  , assert = require('assert')
  , async = require('async')
  , logger = settings.logger(module)
  , models = require('../models')
  , getCommandStats = require('../common/services').getCommandStats
  , UserError = require('../common/exceptions').UserError

var commands = require('../common/commands').all()

var servicesMap = {
  campfire: require('../common/services/campfire'),
  irc: require('../common/services/irc'),
  demo: require('../common/services/demo'),
}

var undisableableCommands = ['enable', 'disable', 'help']

var Bot = module.exports = function Bot(userId, config) {
  var self = this
  // TODO filter the commands down
  this.commands = {}
  Object.keys(commands).forEach(function(name) {
    var modCommands = commands[name]
    if (typeof modCommands === 'function') {
      modCommands = modCommands(config)
      _.each(modCommands, function(command, name) {
        command.name = name
      })
    }
    _.extend(self.commands, modCommands)
  })

  this.created = Date.now()
  this.userId = userId
  this.demo = userId === 'XXX'
  this.services = []
  this.disabled_commands = config.disabled_commands

  this.update(config)
  this.webHook = null
}

Bot.prototype.update = function(config) {
  var self = this
  self.config = config
  self.name = config.name

  var getService = function(config) {
    var service = null
    if(self.services.length !== 0) {
      service = self.services.filter(function(service) { return service.type === config.type })[0]
    }
    return service
  }

  this.config.services.forEach(function(serviceConfig) {
    var service = getService(serviceConfig)
    if(!service) {
      var serviceClass = servicesMap[serviceConfig.type]
      service = new serviceClass(self.commands, serviceConfig, self)
      self.services.push(service)
    } else {
      service.update(serviceConfig)
    }
  })
}

Bot.prototype.botId = function() {
  return this.userId + ':' + this.config._id
}

Bot.prototype.getWebHook = function(callback) {
  var self = this
  if (this.demo) {
    return callback(new UserError("This is a demo bot"))
  }
  if (this.webHook) {
    return callback(null, this.webHook)
  }
  models.User.findById(this.userId, function(err, user) {
    if (err) return callback(err)
    self.webHook = models.User.bot(user).webhook_url
    return callback(undefined, models.User.bot(user).webhook_url)
  })
}

Bot.prototype.setWebHook = function(config, callback) {
  var self = this
  if (this.demo) {
    return callback(new UserError("This is a demo bot"))
  }
  this.webHook = config.url
  models.User.findById(this.userId, function(err, user) {
    if (err) return callback(err)
    models.User.bot(user).webhook_url = config.url
    self.webHook = config.url
    user.save(callback)
  })
}

Bot.prototype.getConfig = function(key, callback) {
  if (this.demo) {
    return callback(new UserError("This is a demo bot"))
  }
  models.User.findById(this.userId, function(err, user) {
    if (err) return callback(err)
    var config = models.User.bot(user).config || {}
    return callback(undefined, config[key])
  })
}

Bot.prototype.setConfig = function(key, value, callback) {
  if (this.demo) {
    return callback(new UserError("This is a demo bot"))
  }
  var self = this
  this.config[key] = value
  models.User.findById(this.userId, function(err, user) {
    if (err) return callback(err)
    var bot = models.User.bot(user)
    if (!bot.config) bot.config = {}
    bot.config[key] = value
    bot.markModified('config')
    user.save(callback)
  })
}

Bot.prototype.disableCommand = function(commandName, callback) {
  if (this.demo) {
    return callback(new UserError('This is a demo bot'))
  }

  if (!isDisableableCommand(this.commands, commandName)) {
    return callback(new UserError('Cannot disable that command.'))
  } else {
    if (!this.disabled_commands) this.disabled_commands = {}
    if (!this.disabled_commands[commandName]) {
      this.disabled_commands[commandName] = true
      models.User.findById(this.userId, function(err, user) {
        if (err) return callback(err)
        var bot = models.User.bot(user)
        if (!bot.disabled_commands) bot.disabled_commands = {}
        bot.disabled_commands[commandName] = true
        bot.markModified('disabled_commands')
        user.save(callback)
      })
    } else {
      return callback(new UserError(commandName + ' is already disabled.'))
    }
  }
}

function isDisableableCommand(commands, commandToDisableName) {
  var localCommandConfig = _.detect(commands, function(command) { return command.name === commandToDisableName })
  if (!localCommandConfig) {
    return false
  } else if (undisableableCommands.indexOf(commandToDisableName) !== -1) {
    return false
  }
  return true
}

Bot.prototype.enableCommand = function(commandName, callback) {
  if (this.demo) {
    return callback(new UserError('This is a demo bot'))
  }

  if (!isEnableableCommand(this.commands, commandName)) {
    return callback(new UserError('Cannot enable that command'))
  } else {
    if (this.disabled_commands && this.disabled_commands[commandName]) {
      delete this.disabled_commands[commandName]
      models.User.findById(this.userId, function(err, user) {
        if (err) return callback(err)
        var bot = models.User.bot(user)
        delete bot.disabled_commands[commandName]
        bot.markModified('disabled_commands')
        user.save(callback)
      })
    } else {
      return callback(new UserError(commandName + ' is already enabled.'))
    }
  }
}

function isEnableableCommand(commands, commandToEnableName) {
  var localCommandConfig = _.detect(commands, function(command) { return command.name === commandToEnableName })
  if (!localCommandConfig)
    return false
  return true
}

Bot.prototype.connect = function(callback) {
  var self = this
  if (this.services.length) {
    var connect = function(service) {service.connect(callback)}
    async.map(this.services, connect, function(err, results) {
      if(!err) {
        self.connected = Date.now()
      }
    callback(err)
    })
  } else {
    callback()
  }
}

Bot.prototype.destroy = function(callback) {
  var self = this
  this.connected = undefined
  if (this.services.length) {
    async.forEach(this.services, function(service, callback) {
      logger.debug("destroying: " + self.botId() + ": " + service.type)
      service.destroy(callback)
    }, callback)
  } else {
    callback()
  }
}

Bot.prototype.broadcast = function(msg, serviceType) {
  logger.debug('broadcasting from ' + this.name)
  this.services.forEach(function(service) {
    if(!serviceType || serviceType === service.type) {
      service.sendMessage(msg)
    }
  })
}

Bot.prototype.status = function(callback) {
  logger.debug('getting status for ' + this.config.name)
  var self = this
  var status = {}
  status.aliveDuration = Date.now() - this.created

  if(this.connected) {
    status.connected = this.connected
    status.connectionDuration = Date.now() - this.connected
  }

  var serviceStatus = function(service, callback) {
    service.status(function(err, stats) {
      if(stats) {
        getCommandStats(service, function(err, commandStats) {
          stats['commands'] = commandStats
          callback(err, stats)
        })
      } else {
       callback(err, stats)
      }
    })
  }

  async.map(this.services, serviceStatus, function(err, result) {
    if(err) {
      logger.error('unable to get bot status', err)
      callback(err, status)
    } else {
      status['services'] = result
      callback(null, status)
    }
  })
}
