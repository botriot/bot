"use strict"

exports.botinfo = {
  hidden: true,
  description: 'Provides information about the bot',
  func: function(room, msg, options) {
    room.paste('id ' + room.config._id)
  }
}

var uptimeParts = [
  {name: 'day', seconds: 86400},
  {name: 'hour', seconds: 3600},
  {name: 'minute', seconds: 60}
]
exports.uptime = {
  hidden: true,
  description: 'How long BOT has been alive (since the last config change / software upgrade)',
  func: function(room, msg, options) {
    var now = Date.now()
      , old = room.bot.created

    var uptime = Math.floor((now - old) / 1000)
      , str = []

    if (uptime <= 0) {
      room.speak("Uptime: < 1 second")
      return
    }

    uptimeParts.forEach(function(part) {
      if (uptime > part.seconds) {
        var t = Math.floor(uptime / part.seconds)
        str.push(t + ' ' + part.name + (t > 1 ? 's' : ''))
        uptime -= t * part.seconds
      }
    })

    if (uptime > 0) {
      str.push(uptime + ' second' + (uptime > 1 ? 's' : ''))
    }

    room.speak("Uptime: " + str.join(', '))
  }
}

