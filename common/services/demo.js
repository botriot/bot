var settings = require('../../settings').init('demo')
  , logger = settings.logger(module)
  , index = require('./index')

var Demo = module.exports = function Demo(commands, config, bot) {
  this.config = config
  this.bot = bot
  this.commands = commands
  this.rules = index.getRules(this)
}

Demo.prototype.status = function(callback) {
  callback(undefined, this.stats || {})
}

Demo.prototype.connect = function(callback) {
  callback()
}

Demo.prototype.destroy = function(callback) {
  callback()
}

Demo.prototype.handleMessage = function(message, callback) {
  var roomObj = {
    paste: function (text) { callback(null, {paste: text}) },
    speak: function (text) { 
      if (typeof(text) == 'object' && text.length) {
        var i = 0
        var interval = setInterval(function(){
          callback(null, {speak: text[i]}) 
          i++
          if(i==text.length) clearInterval(interval)
        },100)
      } else {
        callback(null, {speak: text}) 
      }
      
    },
    users: function(callback) {callback([{name: "Botriot"}, {name: "You"}])},
    image: function(image) { callback(null, {image: image}) },
    commands: this.commands,
    config: this.config,
    bot: this.bot
  }
  var msg = {
    from: {
      id: null,
      name: "You"
    },
    body:message,
    date:new Date()
  }
  index.handleMessage(this, roomObj, msg)
}
