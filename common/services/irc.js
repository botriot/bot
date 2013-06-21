"use strict"

var irc = require('irc')
  , settings = require('../../settings').init('irc')
  , async = require('async')
  , logger = settings.logger(module)
  , index = require('./index')
  , _ = require('underscore')
  , pastie = require('../pastie')
  , UserError = require('../exceptions').UserError

function sleep(delay) {
  var start = new Date().getTime();
  while (new Date().getTime() < start + delay);
}

var Irc = module.exports = function Irc(commands, config, bot) {
  logger.debug('creating irc service')
  var self = this

  this.config = config
  this.bot = bot
  this.type = config.type
  this.commands = commands
  this.clients = []
  this.rules = index.getRules(this)
  this.rooms = []
  this.update(config)
}

Irc.prototype.update = function(config) {
  var newRooms = []
  var roomDict = _.groupBy(config.rooms.concat(this.rooms), function(room) {return room.room})
  Object.keys(roomDict).forEach(function(roomName) {
    newRooms.push(roomDict[roomName][0])
    roomDict[roomName].slice(1).forEach(function(room) {
      var client = room.client
      if(client) {
        logger.debug('disconnecting from ' + room.room + ' because ' + room.nick + ' is being updated')
        client.disconnect('brb')
      }
    })
  })
  this.rooms = newRooms
  this.auth = config.auth
}

function splitRooms(ircConfig) {
  var roomNames = ircConfig.room.replace(' ', '').split(',')
  var rooms = []
  roomNames.forEach(function(roomName) {
    var newConfig = _.clone(ircConfig)
    newConfig.room = roomName
    rooms.push(newConfig)
  })
  return rooms
}

Irc.prototype.error = function(err, callback) {
  callback({})
}

Irc.prototype.connect = function(callback) {
  var self = this
  var roomsToConnectTo = splitRooms(this.rooms[0])
  if(roomsToConnectTo.length === 0) {
    logger.debug('there are no rooms to connect to')
    callback()
  } else {
    async.map(roomsToConnectTo, this.connectToRoom.bind(this), function(err, results) {
      callback(err, results)
    })
  }
}

Irc.prototype.sendMessage = function(msg) {
  this.rooms.forEach(function(room) {
    if(room.client) {
      var roomNames = room.room.split(',')
      roomNames.forEach(function(roomName) {
        room.client.say(roomName, msg)
      })
    }
  })
}

Irc.prototype.connectToRoom = function(room, callback) {
  var self = this
  var roomName = [room.room]
  var oldClient = room.client
  if(oldClient) {
    logger.debug('disconnecting')
    oldClient.disconnect('brb')
    room.client = null
  }
  if (!room.nick) {
    room.nick = this.bot.name
  }

  logger.debug('connecting to ' + roomName + ' as ' + room.nick)
  var client = createIrcClient(room)
  var roomObj = {
    paste: function(text) {
      if(text && text !== '') {
        var pieces = text.split('\n')
        if(pieces.length === 1) { pieces = splitOnCharacters(text, 400) }

        if(pieces.length > 4) {
          pastie.createPastie(pieces.join('\n'), function(err, paste) {
            if(err) {
              client.say(roomName, err)
            } else {
              client.say(roomName, paste)
            }
          })
        } else {
          pieces.forEach(function(piece) {
            piece = splitOnCharacters(piece, 400)
            piece.forEach(function(smallerPiece) {
              client.say(roomName, smallerPiece)
            })
          })
        }
      }
    },
    speak: function(text) {
      if (typeof(text) == 'object' && text.length) {
        text.forEach(function(smallerPiece) {
          client.say(roomName, " " + smallerPiece)
        })
      } else {
        client.say(roomName, " " + text)
      }
    },
    image: function(image) {
      client.say(roomName, index.ensureImageUrl(image))
    },
    users: function(callback) {
      var results = []
      for(var u in client.chans[roomName].users) {
        if(u != self.config.rooms[0].nick)
          results.push({
            'name':u,
            'admin':client.chans[roomName].users[u]=='@'?true:false
          })
      }
      callback(results)
    },
    error: function(error) {
      if (error instanceof UserError && error.message) {
        client.say(roomName, error.message)
      } else {
        logger.error(error)
        client.say(roomName, 'Error :(')
      }
    },
    commands: self.commands,
    config: self.config,
    bot: self.bot
  }

  client.addListener('message'+roomName, function(from, message) {

    if(from == self.config.rooms[0].nick) {
      return
    }

    var msg = {
      service: 'irc',
      from: {
        name: from,
        admin: client.chans[roomName].users[from]=='@'?true:false
      },
      room: {
        name: room.room,
      },
      body: message,
      date: new Date(),
    }
    index.handleMessage(self, roomObj, msg)
  })

  client.on('abort', function(err) {
    callback(new Error('Failed to connect.'))
    room['client'] = null
  })

  client.on('error', function(err) {
    logger.error(err)
  })

  client.connect()
  room['client'] = client

  client.on('registered', function() {
    logger.debug('registered')
    callback(null, room)
  })

  client.conn.on('error', function(err) {
    logger.error(err.stack)
    callback(err)
  })
}

Irc.prototype.roomStatus = function(room, callback) {
  // Just return the room information for now
  room = _.clone(room)
  delete room['client']
  callback(null, room)
}

Irc.prototype.status = function(callback) {
  logger.debug('getting status')
  var status = {
    type: this.type,
    auth: []
  }

  if(this.rooms.length === 0) {
    callback(null, status)
  } else {
    async.map(this.rooms, this.roomStatus, function(err, results) {
      if(err) {
        callback(err)
      } else {
        // TODO: Fix when not single roomed
        status.auth = results[0]
        callback(err, status)
      }
    })
  }
}

Irc.prototype.destroy = function(callback) {
  var disconnect = function(room, callback) {
    if(room.client) {
      room.client.disconnect('Hasta la vista, bitches')
    }
    callback()
  }

  if(this.rooms) {
    async.map(this.rooms, disconnect, function(err, results) {
      callback(err, results)
    })
  } else {
    callback()
  }
}

function createIrcClient(room) {
  return new irc.Client(room.server, room.nick, {
    port: room.port,
    userName: 'botriot',
    realName: 'botriot',
    password: room.password,
    autoConnect: false,
    autoRejoin: false,
    channels: [room.room],
    secure: room.secure,
    floodProtection: true,
    selfSigned: true,
    certExpired: true
  })
}

function splitOnCharacters(inputString, splitInterval) {
  if (inputString.length <= splitInterval) return [inputString]
  var pieces = []
  var start = 0
  while (start <= inputString.length) {
    pieces.push(inputString.substr(start, splitInterval) + '\n')
    start += splitInterval
  }
  return pieces
}
