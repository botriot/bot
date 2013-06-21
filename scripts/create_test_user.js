"use strict"

var settings = require('../settings').init()
  , mongoose = settings.mongoose
  , models = require('../models')

function makeId() {
  var text = ''
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (var i=0; i < 10; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length))

  return text;
}

function createFeatureArray() {
  var features = []
  
  for (var i=0; i<5; i++) {
    var feature = new models.Feature()

    feature.name = makeId()

    console.warn('created a feature with name ' + feature.name)

    features.push(feature)
  }
  return features
}

function createChatRoom() {
  var chatroom = new models.ChatRoom()

  chatroom.type = 'campfire'
  chatroom.channels = ['Room1', 'Room2', 'Room3']

  console.warn('created a chatroom')

  return chatroom
}

function createBot() {
  var bot = new models.Bot()

  bot.name = makeId()
  console.warn('created a bot with name ' + bot.name)
  bot.chat_rooms.push(createChatRoom())
  bot.features = createFeatureArray()

  return bot
}

var createUser = function() {
  var user = new models.User()

  user.bots.push(createBot())

  console.warn('saving a user')

  user.save(function(err) {
    if (err) {
      console.warn('failed')
    } else {
      console.warn('success')
    }
  })
}

if (require.main === module) {
  createUser()
}
