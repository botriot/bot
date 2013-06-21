"use strict"

var request = require('request')
  , _ = require('underscore')

var regex = /^((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))$/i

exports.webhook = {
  description: 'This command is used to setup a webhook. The bot will send a POST request to a URL for any command that it doesn\'t know how to handle. Details on the exchange can be found here https://gist.github.com/1177375',
  commands: {
    'set <url>': {
      description: 'Set the URL that the webhook will send messages to',
      admin: true,
      func: function(room, url, options) {
        if (!url.match(regex)) {
          return room.speak("Invalid URL")
        }
        room.bot.setWebHook({url: url}, function(err) {
          if (err) return room.error(err)

          room.speak("Webhook changed, reloading self")
          require('../../bot/bots').updateOrCreate(room.bot.userId, room.bot.config, function(){})
        })
      },
    },

    'off': {
      description: 'Stop messages being sent to the webhook',
      admin: true,
      func: function(room, msg, options) {
        room.bot.setWebHook({url: null}, function(err) {
          if (err) return room.error(err)

          room.speak("Webhook disabled")
        })
      },
    },

    'status': {
      description: 'View the current URL being used in the webhook',
      func: function(room, msg, options) {
        room.bot.getWebHook(function(err, url) {
          if (err) return room.error(err)

          if (url) {
            room.speak("Active webhook: " + url)
          } else {
            room.speak("Webhook disabled. See !help webhook")
          }
        })
      }
    }
  }
}
