var ranger = require('wadey-ranger')
  , settings = require('../../settings').init('campfire')
  , async = require('async')
  , _ = require('underscore')
  , logger = settings.logger(module)
  , index = require('./index')
  , UserError = require('../exceptions').UserError

var Campfire = module.exports = function Campfire(commands, config, bot) {
  var self = this

  this.config = config
  this.bot = bot
  this.type = config.type
  this.commands = commands
  this.rules = index.getRules(this)
  this.connectedRooms = []
  this.users = {}
  this.update(config)
}

Campfire.prototype.sendMessage = function(msg) {
  this.client.rooms(function(err, rooms) {
    rooms.forEach(function(room) {
      if(err) {
        logger.error(err)
      } else {
        room.speak(msg)
      }
    })
  })
}

Campfire.prototype.update = function(config, callback) {
  this.auth = config.auth
  this.rooms = config.rooms || []
}

Campfire.prototype.error = function(err, callback) {
  this.err = err
  // TODO
  if (callback) {
    callback(err)
  } else {
    logger.error(err.stack || err)
  }
}

Campfire.prototype.connect = function(callback) {
  var self = this

  if (this.auth && !this.auth.account || !this.auth.token) {
    process.nextTick(function() {
      callback(new Error('Campfire account name and token is required'))
    })
    return
  }

  this.client = ranger.createClient(this.auth.account, this.auth.token)
  
  this.client.me(function(err, info) {
    self["user"] = info
    self.client.rooms(function(err, rooms) {
      if (err) return self.error(err, callback)
      // Store the rooms for status updates

      if (rooms === undefined || rooms.length === 0) {
        logger.warn('no rooms to connect to :(')
        callback()
      } else {
        logger.debug('connecting to: ' + JSON.stringify(rooms))
        async.forEach(rooms, self.connectToRoom.bind(self), function(err) {
          callback(err)
        })
      }
    })
  })
  
}

Campfire.prototype.connectToRoom = function(room, callback) {
  var self = this
  logger.debug('connecting to ' + room.name)

  var roomObj = {
    paste: function(text) {
      room.paste(text)
    },
    speak: function(text) {
      if (typeof(text) == 'object' && text.length) {
        var i = 0
        var speakback = function(line) {
          if (line.match(/^https?:\/\/twitter.com\/#?!?\w+\/status\/\d+$/)) {
            room.tweet(line, function() {
              i++
              if (i==text.length) return
              else speakback(text[i])
            })
          } else {
            room.speak(" " + line, function() {
              i++
              if (i==text.length) return
              else speakback(text[i])
            })
          }
        }
        speakback(text[i])
      } else {
        if (text.match(/^https?:\/\/twitter.com\/#?!?\w+\/status\/\d+$/)) {
          room.tweet(text)
        } else {
          room.speak(" " + text)
        }
      }
    },
    image: function(image) {
      room.speak(index.ensureImageUrl(image))
    },
    users: function(callback) {
      // TODO make generic
      room.users(function(err, users) {
        if (err) return self.error(err)
        var finalusers = []
        users.forEach(function(user){
          if(user.id!=self.user.id) finalusers.push(user)
        })
        callback(finalusers)
      })
    },
    error: function(error) {
      if (error instanceof UserError && error.message) {
        room.speak(error.message)
      } else {
        logger.error(error)
        room.speak('Error :(')
      }
    },
    commands: this.commands,
    config: this.config,
    bot: this.bot
  }

  this.connectedRooms.push(room)

  room.join(function(err) {
    if (err) return self.error(err, callback)
    room.listen(function(err, message) {
      if (err) return self.error(err)
      if (message.type !== "TextMessage" && message.type !== "TweetMessage") {
        return
      }
      if (message.type === "TweetMessage") {
        message.tweetbody = message.body
        message.body = "https://twitter.com/" + message.body.split("\n:")[1].split(": ")[1] + "/status/" + message.body.split("\n:")[4].split(": ")[1].trim()
      }
      self.getUser(room, message.userId, function(err, user) {
        if (err) return self.error(err)

        if(message.userId==self.user.id) {
          return
        }

        var msg = {
          service: 'campfire',
          from: {
            id: message.userId,
            name: user.name,
            admin: user.admin,
            email: user.emailAddress
          },
          room: {
            id: room.id,
            name: room.name,
            topic: room.topic,
            locked: room.locked,
          },
          body: message.body,
          date: new Date(),
        }
        index.handleMessage(self, roomObj, msg)
      })
    })
    callback()
  })
}

Campfire.prototype.getUser = function(room, userId, callback) {
  var self = this
  if (this.users[userId]) {
    return callback(null, this.users[userId])
  }
  this.client.user(userId, function(err, user) {
    if (err) return callback(err)

    self.users[userId] = user
    callback(null, user)
  })
}

Campfire.prototype.roomStatus = function (room, callback) {
  var self = this

  var status = {
    name: room.name,
    topic: room.topic,
    auth: self.auth,
  }

  room.users(function(err, users) {
    if (err) return self.error(err, callback)
    status.users = users
    callback(undefined, status)
  })
}

Campfire.prototype.status = function(callback) {
  logger.debug('getting status')
  var self = this
  var status = {
    type:'campfire', 
    connected: [], 
    available: [],
    auth: self.auth,
    rooms: self.rooms
  }

  if (this.availableRooms === undefined || this.availableRooms.length === 0) {
    // TODO: provide recent errors here because
    // there is probably a good reason why we weren't able
    // to connect to a room
    callback(undefined, status)
  } else {
    async.map(this.availableRooms, this.roomStatus, function (err, results) {
      if (err) return self.error(err, callback)
      results.forEach(function(result) {
        if (_.any(self.connectedRooms, function(cRoom) {return cRoom.name == result.name})) {
          status.connected.push(result)
        } else {
          status.available.push(result)
        }
      })
      callback(undefined, status)
    })
  }
}

Campfire.prototype.destroy = function(callback) {
  if(this.connectedRooms) {
    this.connectedRooms.forEach(function(room) {
      logger.debug('disconnecting from ' + room.name)
      room.stopListening()
      room.leave()
    })
    this.connectedRooms = []
  }
  callback()
}
