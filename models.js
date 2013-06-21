"use strict"

var settings = require('./settings')
  , mongoose = settings.mongoose
  , hook = settings.hook
  , Schema = mongoose.Schema
  , ObjectId = mongoose.ObjectId
  , mongooseAuth = require('mongoose-auth')
  , LocalUser
  , _ = require('underscore')
  , logger = settings.logger(module)

var CommandSchema = new Schema({
  name: String,
  help: String,
  type: String,
  config: {},
  options: Array,
  commands: Array
})

var ServiceSchema = new Schema({
  type: String,
  rooms: {},
  auth: {}
})

var BotSchema = new Schema({
  name: {type: String, index: true},
  services: [ServiceSchema],
  commands: [CommandSchema],
  config: {},
  webhook_url: String,
  disabled_commands: {}
})

var UserSchema = new Schema({
  bots: [BotSchema]
})

UserSchema.methods.is_admin = function() {
  return (settings.config.admins.indexOf(this.twit.screenName) !== -1)
}

UserSchema.plugin(mongooseAuth, {
  everymodule: {
    everyauth: {
      User: function () {
        return LocalUser
      }
    }
  },
  twitter: {
    everyauth: {
      myHostname: settings.config.twitter.hostname,
      consumerKey: settings.config.twitter.consumerKey,
      consumerSecret: settings.config.twitter.consumerSecret,
      redirectPath: '/dashboard/'
    }
  }
})

exports.Command = mongoose.model('Commands', CommandSchema)
exports.Service = mongoose.model('Service', ServiceSchema) 
exports.Bot = mongoose.model('Bot', BotSchema)
exports.User = mongoose.model('User', UserSchema)
LocalUser = mongoose.model('User')

exports.Bot.spawn = function (user, bot, callback) {
  logger.debug('spawning ' + user._id + ": " + bot.name)
  hook.emit('botUpdated', {user: user._id, bot: bot.toJSON(), callback: callback})
}

exports.Bot.service = function (bot, type) {
  return bot.services.filter(function(service) { return service.type === type })[0]
}

// We are only using one bot per user for now
exports.User.bot = function (user) { 
  if(user.bots && user.bots.length) {
    return user.bots[0]
  }
}

// Setup the available commands
var commandSets = require('./common/commands').all()
var enabledCommandSets = ['base', 'search', 'curse', 'rage', 'help', 'simplegeo', 'fun', 'nerdicon']

var dc = []
var ac = {}

var loadCommands = function() {
  Object.keys(commandSets).forEach(function(commandFile) {
    // Substring due to .js extensions
    var commandSetName = commandFile.substr(0, commandFile.length - 3)
    var commands = commandSets[commandFile]
    Object.keys(commands).forEach(function(commandName) {
      var command = commands[commandName]
      if (command.hidden) {
        // Skip
        return
      }
      var c = new exports.Command()
      c.name = command.name
      c.help = command.description
      c.options = command.options
      c.commands = command.commands
      c.type = commandSetName
      c.config = {}
      if(c.commands)
        console.log(c.commands[0])
      if(_.any(enabledCommandSets, function(name) {return name === commandSetName})) {
        dc.push(c)
      }
      if(!ac[commandSetName]) {
        ac[commandSetName] = {}
      }

      ac[commandSetName][c.name] = c.toJSON()
    })
  })
}

exports.allCommands = function() {
  if(!ac || Object.keys(ac).length === 0) {
    loadCommands()
  }
  return ac
}

exports.defaultCommands = function() {
  if(!dc || dc.length === 0) {
    loadCommands()
  }
  return dc
}
