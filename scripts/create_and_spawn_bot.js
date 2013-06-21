"use strict"

var settings = require('../settings').init()
  , mongoose = settings.mongoose
  , models = require('../models')

function createService() {
  var service = new models.Service()
  service.type = 'campfire'
  service.rooms = [{name:'Da Room'}]
  service.auth = {account:'', token: ''}
  return service
}

var createBot = function(callback) {
  models.Bot.findOne({name: 'Jesus'}, function(err, bot) {
    if (err) throw err
    console.log(bot)
    if (!bot) {
      bot = new models.Bot()
      bot.name = "Jesus"
    }
    bot.services = [createService()]
    bot.save(function(err) {
      callback(err, bot)
    })
  })
}

// var createUser = function(callback) {
//   models.User.findOne({name: 'TestSpawn
// }

if (require.main === module) {
  createBot(function(err, bot) {
    if(err) throw err
    bot.spawn(function(err, status) {
      console.log('status: ', status)
      console.log('err: ', err)
      process.exit(1)
    })
  })
}
