"use strict"

var jsonHelper = require('../../common').jsonHelper

exports.kanye = {
  description: "Selections from Kayne's blog and twitter",
  func: function(room, msg, options) {
    jsonHelper(room, 'http://jamiedubs.com/quotable-kanye/api.json', function(body) {
      room.speak(body.quote)
    })
  }
}

if(require.main === module) {
  exports.kanye.func({speak: console.log})
}
