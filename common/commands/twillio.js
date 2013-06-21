"use strict"

var twilio = require('twilio').Client

var phones = {

}

var getPhone = function(creds, callback) {
  var phone = phones[creds.outgoing]
  if (phone) {
    callback(null, phone)
  } else {
    var client = new twilio(creds.account, creds.token, creds.outgoing+'.botriot.com')
    var phone = client.getPhoneNumber(creds.outgoing)
    phone.setup(function(err) {
      if(!err) phones[creds.outgoing] = phone
      callback(err, phone)
    })
  }
}

exports.sms = {
  description: "Send a SMS to someone",
  hidden: true,
  commands: {
    'list': {
      description: 'List the phone book',
      func: function(room, msg) {
        room.getConfig(function(err, config) {
          var users = config.users
          if (err) return room.error(err)
          if (!users) {
            room.speak("none is registered yet :(. Use !sms update <name> <phone_number>")
          } else {
            var userText = ""
            Object.keys(users).forEach(function(name) {
              var user = users[name]
              userText += name + ' ' + user.phoneNumber + '\n'
            })
            room.speak(userText)
          }
        })
      }
    },

    'update <name> <number>' : {
      admin: true,
      description: 'Update the phone book',
      func: function(room, msg, options) {
        var name = options.args[0]
        var number = options.args[1]

        room.getConfig(function(err, config) {
          if (err) return room.error(err)
          var users = config.users
          if (!users) users = {}
          if (!users[name]) users[name] = {}

          users[name]['phoneNumber'] = number
          room.setConfig('users', users, function(err) {
            if (err) return room.error(err)
            room.speak('updated ' + number + ' with ' + name)
          })
        })
      }
    },

    'register <account> <token> <outgoing>': {
      admin: true,
      description: 'Register the Twillio information in order to make SMS possible',
      options: [
        ['-a, --account', 'Twillio account SID'],
        ['-t, --token', 'Twillio authentication token'],
        ['-o, --outgoing', 'The outgoing number to use when sending a SMS']
      ],
      func: function(room, msg, options) {
        var account = option.account
        var token = options.token
        var outgoing = option.outgoing

        if(!outgoing || !token || !account) {
          return room.speak('Missing a required option')
        }

        room.getConfig(function(err, config) {
          if (err) return room.error(err)
          var creds = config.creds || {}

          creds['account'] = account
          creds['token'] = token
          creds['outgoing'] = outgoing

          room.setConfig('creds', creds, function(err) {
            if (err) return room.error(err)
            room.speak('Registed ' + token + ' with ' + account)
          })
        })
      }
    },

    'remove <user>': {
      admin: true,
      description: 'Remove a user from the phone book',
      func: function(room, msg, options) {
        var user = msg
        room.getConfig(function(err, config) {
          if (err) return room.error(err)
          var users = config.users || {}
          delete(users[user])
          room.setConfig('users', users, function(err) {
            if (err) return room.error(err)
            room.speak(user + ' has been removed')
          })
        })
      }
    },

    'send <user> <msg>': {
      description: 'Send a message to a user',
      options: [
        ['-u, --u', 'The receipient of the message'],
      ],
      func: function(room, msg, options) {
        var to = options.user

        if(!to) {
          return room.speak("Please specify a user with '-u'")
        }

        var txt = msg
        room.getConfig(function(err, config) {
          if (err) return room.error(err)
          var users = config.users || {}
          var toUser = users[to]

          if (!toUser || !toUser.phoneNumber) {
            var errText = "no phone number registered for '"+toUser
            errText += "\n"
            errText += "User !sms update " + to + " <phone_number>"
            return room.speak(errText)
          }

          var creds = config.creds
          if (!creds || !creds.account) {
            var errText = "no credentials have been registered"
            errText += "\n"
            errText += "User !sms register <account> <token> <outgoing_phone_number>"
            return room.speak(errText)
          }

          getPhone(creds, function(err, phone) {
            if (err) return room.error(err)
            room.speak('sending message to ' + to)
            phone.sendSms(toUser.phoneNumber, txt, null, function(sms) {
              sms.on('processed', function(reqParams, response) {
                room.speak('message sent to ' + to + ' at ' + toUser.phoneNumber)
              })
            })
          })
        })
      }
    }
  }
}
